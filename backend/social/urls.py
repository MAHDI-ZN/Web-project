from django.urls import include, path
from rest_framework.routers import DefaultRouter

from social.views import NotificationViewSet, TicketViewSet

router = DefaultRouter()
router.register("notifications", NotificationViewSet, basename="notification")
router.register("tickets", TicketViewSet, basename="ticket")

urlpatterns = [path("", include(router.urls))]
