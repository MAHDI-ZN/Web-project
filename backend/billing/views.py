from calendar import monthrange
from datetime import date

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from billing.gateways import get_gateway
from billing.models import ArtistPayout, Payment, SubscriptionPrice
from core.permissions import IsAdmin
from django.conf import settings
from reports.services import ReportService


def add_months(d: date, months: int) -> date:
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, monthrange(year, month)[1])
    return date(year, month, day)


class PriceView(APIView):
    def get_permissions(self):
        if self.request.method == "PUT":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        prices = SubscriptionPrice.get_solo()
        return Response({"silver": prices.silver, "gold": prices.gold})

    def put(self, request):
        prices = SubscriptionPrice.get_solo()
        silver = request.data.get("silver")
        gold = request.data.get("gold")
        try:
            prices.silver = int(silver)
            prices.gold = int(gold)
        except (TypeError, ValueError):
            return Response({"error": "قیمت نامعتبر است."}, status=400)
        if prices.silver <= 0 or prices.gold <= 0:
            return Response({"error": "قیمت باید مثبت باشد."}, status=400)
        prices.save()
        return Response({"silver": prices.silver, "gold": prices.gold})


class PaymentViewSet(viewsets.GenericViewSet):
    queryset = Payment.objects.all()
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    def list(self, request):
        items = [
            {
                "id": str(p.pk),
                "tier": p.tier,
                "months": p.months,
                "amount": p.amount,
                "status": p.status,
                "createdAt": p.created_at.isoformat(),
            }
            for p in self.get_queryset()[:20]
        ]
        return Response(items)

    @action(detail=False, methods=["post"])
    def initiate(self, request):
        tier = request.data.get("tier")
        months = int(request.data.get("months") or 0)
        if tier not in (Payment.Tier.SILVER, Payment.Tier.GOLD):
            return Response({"error": "نوع اشتراک نامعتبر است."}, status=400)
        if months not in (1, 3, 6, 12):
            return Response({"error": "بازه پرداخت باید ۱، ۳، ۶ یا ۱۲ ماه باشد."}, status=400)
        prices = SubscriptionPrice.get_solo()
        unit = prices.silver if tier == Payment.Tier.SILVER else prices.gold
        amount = unit * months
        gateway = get_gateway()
        callback = f"{settings.FRONTEND_URL}/payment/callback"
        result = gateway.request_payment(amount, callback, f"اشتراک {tier} — {months} ماه")
        if not result.ok:
            return Response({"error": result.error}, status=502)
        payment = Payment.objects.create(
            user=request.user,
            tier=tier,
            months=months,
            amount=amount,
            authority=result.authority,
            gateway=gateway.name,
            status=Payment.Status.PENDING,
        )
        return Response(
            {
                "id": str(payment.pk),
                "amount": amount,
                "redirectUrl": result.redirect_url,
                "authority": result.authority,
                "status": payment.status,
            },
            status=201,
        )

    @action(detail=False, methods=["post"])
    def verify(self, request):
        authority = request.data.get("authority") or request.data.get("Authority")
        gateway_status = (request.data.get("status") or request.data.get("Status") or "OK").upper()
        payment = Payment.objects.filter(authority=authority, user=request.user).first()
        if not payment:
            return Response({"error": "تراکنش یافت نشد."}, status=404)
        if payment.status == Payment.Status.SUCCESS:
            return Response({"status": "success", "tier": payment.tier, "months": payment.months})
        if gateway_status != "OK":
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"])
            return Response({"error": "پرداخت لغو شد.", "status": "failed"}, status=400)

        gateway = get_gateway()
        result = gateway.verify(authority, payment.amount)
        if not result.ok:
            payment.status = Payment.Status.FAILED
            payment.save(update_fields=["status"])
            return Response({"error": result.error or "تراکنش ناموفق بود.", "status": "failed"}, status=400)

        payment.status = Payment.Status.SUCCESS
        payment.ref_id = result.ref_id
        payment.save(update_fields=["status", "ref_id"])

        user = request.user
        start = date.today()
        if user.subscription_expires_at and user.subscription_expires_at > start:
            start = user.subscription_expires_at
        expires = add_months(start, payment.months)
        user.subscription_tier = payment.tier
        user.subscription_expires_at = expires
        user.save(update_fields=["subscription_tier", "subscription_expires_at"])
        return Response(
            {
                "status": "success",
                "tier": user.subscription_tier,
                "expiresAt": user.subscription_expires_at.isoformat(),
                "refId": payment.ref_id,
            }
        )


class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdmin]
    queryset = ArtistPayout.objects.select_related("artist")

    def list(self, request):
        ReportService().ensure_monthly_payouts()
        items = []
        for payout in self.get_queryset():
            artist = payout.artist
            items.append(
                {
                    "id": str(payout.pk),
                    "artistId": str(artist.pk),
                    "artistName": getattr(getattr(artist, "artist_profile", None), "stage_name", None)
                    or artist.display_name,
                    "uniqueListeners": payout.unique_listeners,
                    "streams": payout.streams,
                    "amount": payout.amount,
                    "paymentStatus": payout.payment_status,
                    "month": payout.month,
                }
            )
        return Response(items)

    @action(detail=True, methods=["post"])
    def settle(self, request, pk=None):
        payout = self.get_object()
        payout.payment_status = ArtistPayout.PaymentStatus.SETTLED
        payout.save(update_fields=["payment_status"])
        return Response(
            {
                "id": str(payout.pk),
                "paymentStatus": payout.payment_status,
            }
        )
