from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import ArtistProfile, Follow, User
from billing.models import ArtistPayout, Payment, SubscriptionPrice
from catalog.models import Album, Playlist, PlaylistTrack, StreamEvent, Track
from social.models import Notification, Ticket, TicketMessage

AUDIO = {
    "a": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "b": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "c": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "d": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    "e": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
}


def cover(seed: str) -> str:
    return f"https://picsum.photos/seed/{seed}/400/400"


class Command(BaseCommand):
    help = "Load demo users, catalog, tickets, and prices."

    def handle(self, *args, **options):
        if User.objects.filter(email="admin@demo.com").exists():
            self.stdout.write("Seed already present — skipped.")
            return

        day = date.today()
        password = "demo1234"

        sara = User.objects.create_user(
            email="sara@demo.com",
            password=password,
            username="sara_basic",
            display_name="سارا شنونده",
            role=User.Role.LISTENER,
            gender=User.Gender.FEMALE,
            birth_date=date(1998, 5, 12),
            subscription_tier=User.Tier.BASIC,
            daily_stream_count=12,
            daily_stream_date=day,
        )
        ali = User.objects.create_user(
            email="ali@demo.com",
            password=password,
            username="ali_silver",
            display_name="علی نقره‌ای",
            role=User.Role.LISTENER,
            gender=User.Gender.MALE,
            birth_date=date(1995, 3, 20),
            subscription_tier=User.Tier.SILVER,
            subscription_expires_at=date(2026, 12, 1),
            daily_stream_count=40,
            daily_stream_date=day,
        )
        nima = User.objects.create_user(
            email="nima@demo.com",
            password=password,
            username="nima_gold",
            display_name="نیما طلایی",
            role=User.Role.LISTENER,
            gender=User.Gender.MALE,
            birth_date=date(1992, 11, 8),
            subscription_tier=User.Tier.GOLD,
            subscription_expires_at=date(2027, 1, 1),
            daily_stream_count=100,
            daily_stream_date=day,
        )
        ava = User.objects.create_user(
            email="ava@demo.com",
            password=password,
            username="ava_mehr",
            display_name="آوا مهر",
            role=User.Role.ARTIST,
            subscription_tier=User.Tier.GOLD,
            daily_stream_date=day,
        )
        ArtistProfile.objects.create(
            user=ava,
            bio="خواننده و آهنگساز مستقل با تمرکز روی پاپ و الکترونیک.",
            verified=True,
            status=ArtistProfile.Status.APPROVED,
            sample_works="نمونه‌کارهای منتشرشده روی پلتفرم",
            stage_name="آوا مهر",
        )
        kaveh = User.objects.create_user(
            email="kaveh@demo.com",
            password=password,
            username="kaveh_new",
            display_name="کاوه نوپا",
            role=User.Role.ARTIST,
            daily_stream_date=day,
        )
        ArtistProfile.objects.create(
            user=kaveh,
            bio="هنرمند تازه‌کار در انتظار تأیید.",
            verified=False,
            status=ArtistProfile.Status.PENDING,
            sample_works="لینک دمو / فایل‌های نمونه",
            stage_name="کاوه نوپا",
        )
        User.objects.create_user(
            email="support@demo.com",
            password=password,
            username="support1",
            display_name="پشتیبان ملودی",
            role=User.Role.SUPPORT,
            subscription_tier=User.Tier.GOLD,
            daily_stream_date=day,
        )
        User.objects.create_user(
            email="admin@demo.com",
            password=password,
            username="admin",
            display_name="مدیر سامانه",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
            subscription_tier=User.Tier.GOLD,
            daily_stream_date=day,
        )

        Follow.objects.bulk_create(
            [
                Follow(follower=sara, following=ava),
                Follow(follower=ali, following=ava),
                Follow(follower=nima, following=ava),
                Follow(follower=nima, following=kaveh),
                Follow(follower=nima, following=sara),
                Follow(follower=sara, following=nima),
            ]
        )

        album1 = Album.objects.create(
            title="شهر خاموش",
            year=2025,
            genre="پاپ",
            cover_url=cover("album1"),
        )
        album1.artists.add(ava)
        album2 = Album.objects.create(
            title="ارتفاع",
            year=2024,
            genre="راک",
            cover_url=cover("album2"),
        )
        album2.artists.add(ava)

        tracks_data = [
            ("سپیده‌دم", album1, AUDIO["a"], cover("track1"), "پاپ", "در سپیده‌دم\nصدای شهر آرام می‌گیرد", 372, 15200, 4200, False, False),
            ("شب‌های تهران", album1, AUDIO["b"], cover("track2"), "پاپ", "شب‌های تهران\nنور نئون و صدای باران", 401, 22100, 6100, False, False),
            ("موج آرام", album1, AUDIO["c"], cover("track3"), "الکترونیک", "", 350, 9800, 3000, False, False),
            ("تک‌آهنگ طلایی", None, AUDIO["d"], cover("track4"), "ایندی", "این تک‌آهنگ زودهنگام است", 310, 1200, 800, True, True),
            ("پرواز", album2, AUDIO["e"], cover("track5"), "راک", "", 290, 45000, 12000, False, False),
        ]
        created_tracks = []
        for title, album, audio, cov, genre, lyrics, duration, streams, listeners, early, single in tracks_data:
            track = Track.objects.create(
                title=title,
                album=album,
                audio_url=audio,
                cover_url=cov,
                genre=genre,
                lyrics=lyrics,
                year=2025 if album != album2 else 2024,
                duration=duration,
                streams=streams,
                listeners=listeners,
                early_access=early,
                is_single=single or album is None,
            )
            track.artists.add(ava)
            created_tracks.append(track)

        pl1 = Playlist.objects.create(owner=sara, name="تمرکز صبح", cover_url=cover("pl1"))
        PlaylistTrack.objects.create(playlist=pl1, track=created_tracks[0], position=0)
        PlaylistTrack.objects.create(playlist=pl1, track=created_tracks[2], position=1)
        pl2 = Playlist.objects.create(owner=nima, name="شب‌گردی", cover_url=cover("pl2"))
        for i, track in enumerate([created_tracks[1], created_tracks[3], created_tracks[4]]):
            PlaylistTrack.objects.create(playlist=pl2, track=track, position=i)

        now = timezone.now()
        for i in range(8):
            StreamEvent.objects.create(
                user=nima, track=created_tracks[i % 5], created_at=now - timedelta(days=i)
            )
            StreamEvent.objects.create(
                user=ali, track=created_tracks[0], created_at=now - timedelta(hours=i + 1)
            )

        Notification.objects.bulk_create(
            [
                Notification(
                    user=sara,
                    title="مهلت اشتراک",
                    body="اشتراک پایه شما رایگان است؛ برای امکانات بیشتر ارتقا دهید.",
                    href="/settings",
                ),
                Notification(
                    user=nima,
                    title="اثر جدید",
                    body="آوا مهر تک‌آهنگ جدیدی منتشر کرد.",
                    href="/browse",
                ),
                Notification(
                    user=kaveh,
                    title="در انتظار تأیید",
                    body="درخواست حساب هنرمندی شما در حال بررسی است.",
                    read=True,
                ),
                Notification(
                    user=User.objects.get(email="support@demo.com"),
                    title="تیکت جدید",
                    body="یک تیکت پشتیبانی جدید ثبت شد.",
                    href="/admin/tickets",
                ),
                Notification(
                    user=User.objects.get(email="admin@demo.com"),
                    title="درخواست هنرمند",
                    body="کاوه نوپا درخواست تأیید حساب داده است.",
                    href="/admin/artist-requests",
                ),
            ]
        )

        t1 = Ticket.objects.create(user=sara, subject="مشکل پخش آهنگ", status=Ticket.Status.OPEN)
        TicketMessage.objects.create(
            ticket=t1, sender=sara, body="بعضی آهنگ‌ها بعد از چند ثانیه قطع می‌شوند."
        )
        t2 = Ticket.objects.create(user=ali, subject="سوال درباره دانلود", status=Ticket.Status.ANSWERED)
        TicketMessage.objects.create(
            ticket=t2, sender=ali, body="دانلود آهنگ از کجا فعال می‌شود؟"
        )
        TicketMessage.objects.create(
            ticket=t2,
            sender=User.objects.get(email="support@demo.com"),
            body="از منوی کارت آهنگ گزینه دانلود را بزنید (اشتراک نقره‌ای و بالاتر).",
        )

        prices = SubscriptionPrice.get_solo()
        prices.silver = 99000
        prices.gold = 199000
        prices.save()

        Payment.objects.create(
            user=nima,
            tier=Payment.Tier.GOLD,
            months=12,
            amount=199000 * 12,
            status=Payment.Status.SUCCESS,
            authority="SEED-GOLD",
            gateway="mock",
            ref_id="SEED-REF",
        )

        ArtistPayout.objects.create(
            artist=ava,
            unique_listeners=8200,
            streams=94000,
            amount=8200 * 500 + 94000 * 50,
            payment_status=ArtistPayout.PaymentStatus.PENDING,
            month="2026-07",
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))
