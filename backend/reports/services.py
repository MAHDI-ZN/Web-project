from calendar import monthrange
from datetime import date, datetime, time

from django.conf import settings
from django.db.models import Count, Sum
from django.utils import timezone

from accounts.models import User
from billing.models import ArtistPayout, Payment, SubscriptionPrice
from catalog.models import StreamEvent, Track
from social.factory import NotificationFactory
from social.models import Ticket


def month_bounds(month: str | None = None):
    if month:
        year, mon = [int(part) for part in month.split("-")]
    else:
        today = timezone.localdate()
        year, mon = today.year, today.month
    start = datetime(year, mon, 1, tzinfo=timezone.get_current_timezone())
    last = monthrange(year, mon)[1]
    end = datetime.combine(date(year, mon, last), time.max, tzinfo=timezone.get_current_timezone())
    return start, end, f"{year:04d}-{mon:02d}"


class RoyaltyCalculator:
    """Domain service: artist payout from unique listeners + streams."""

    def __init__(self, listener_rate=None, stream_rate=None):
        self.listener_rate = listener_rate or settings.ROYALTY_LISTENER_RATE
        self.stream_rate = stream_rate or settings.ROYALTY_STREAM_RATE

    def compute(self, unique_listeners: int, streams: int) -> int:
        return unique_listeners * self.listener_rate + streams * self.stream_rate


class ReportService:
    def __init__(self):
        self.royalty = RoyaltyCalculator()

    def admin_dashboard(self):
        prices = SubscriptionPrice.get_solo()
        users = User.objects.all()
        basic = users.filter(subscription_tier=User.Tier.BASIC).count()
        silver = users.filter(subscription_tier=User.Tier.SILVER).count()
        gold = users.filter(subscription_tier=User.Tier.GOLD).count()
        start, end, month = month_bounds()
        monthly_revenue = (
            Payment.objects.filter(
                status=Payment.Status.SUCCESS, created_at__range=(start, end)
            ).aggregate(total=Sum("amount"))["total"]
            or 0
        )
        return {
            "userCount": users.count(),
            "subscriptionDistribution": {
                "basic": basic,
                "silver": silver,
                "gold": gold,
            },
            "silverUserCount": silver,
            "goldUserCount": gold,
            "monthlyRevenue": monthly_revenue,
            "prices": {"silver": prices.silver, "gold": prices.gold},
            "month": month,
        }

    def support_dashboard(self):
        return {
            "openTickets": Ticket.objects.filter(status=Ticket.Status.OPEN).count(),
            "answeredTickets": Ticket.objects.filter(status=Ticket.Status.ANSWERED).count(),
            "closedTickets": Ticket.objects.filter(status=Ticket.Status.CLOSED).count(),
            "pendingArtists": User.objects.filter(
                role=User.Role.ARTIST, artist_profile__status="pending"
            ).count(),
        }

    def artist_dashboard(self, artist: User):
        tracks = Track.objects.filter(artists=artist)
        start, end, month = month_bounds()
        events = StreamEvent.objects.filter(track__in=tracks, created_at__range=(start, end))
        totals = events.aggregate(
            streams=Count("id"),
            unique_listeners=Count("user", distinct=True),
        )
        streams = totals["streams"] or 0
        unique_listeners = totals["unique_listeners"] or 0
        track_rows = []
        for track in tracks:
            te = events.filter(track=track)
            t_streams = te.count()
            t_listeners = te.values("user").distinct().count()
            track_rows.append(
                {
                    "id": str(track.pk),
                    "title": track.title,
                    "streams": t_streams,
                    "listeners": t_listeners,
                    "lifetimeStreams": track.streams,
                    "lifetimeListeners": track.listeners,
                    "revenue": self.royalty.compute(t_listeners, t_streams),
                }
            )
        return {
            "month": month,
            "tracks": track_rows,
            "totals": {
                "streams": streams,
                "uniqueListeners": unique_listeners,
                "revenue": self.royalty.compute(unique_listeners, streams),
            },
        }

    def ensure_monthly_payouts(self, month: str | None = None):
        start, end, month_key = month_bounds(month)
        calculator = self.royalty
        artists = User.objects.filter(
            role=User.Role.ARTIST, artist_profile__status="approved"
        )
        created = []
        for artist in artists:
            events = StreamEvent.objects.filter(
                track__artists=artist, created_at__range=(start, end)
            )
            streams = events.count()
            unique_listeners = events.values("user").distinct().count()
            amount = calculator.compute(unique_listeners, streams)
            payout, was_created = ArtistPayout.objects.get_or_create(
                artist=artist,
                month=month_key,
                defaults={
                    "unique_listeners": unique_listeners,
                    "streams": streams,
                    "amount": amount,
                },
            )
            if not was_created and payout.payment_status == ArtistPayout.PaymentStatus.PENDING:
                payout.unique_listeners = unique_listeners
                payout.streams = streams
                payout.amount = amount
                payout.save(update_fields=["unique_listeners", "streams", "amount"])
            elif was_created:
                NotificationFactory.payout_ready(artist, month_key, amount)
            created.append(payout)
        return created
