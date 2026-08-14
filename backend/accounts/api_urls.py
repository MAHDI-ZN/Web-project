from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import ArtistRequestViewSet, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("artist-requests", ArtistRequestViewSet, basename="artist-request")

urlpatterns = [
    path("", include(router.urls)),
]
