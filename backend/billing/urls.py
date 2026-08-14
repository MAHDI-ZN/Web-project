from django.urls import include, path
from rest_framework.routers import DefaultRouter

from billing.views import PaymentViewSet, PayoutViewSet, PriceView

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")
router.register("payouts", PayoutViewSet, basename="payout")

urlpatterns = [
    path("prices/", PriceView.as_view()),
    path("", include(router.urls)),
]
