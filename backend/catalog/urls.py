from django.urls import include, path
from rest_framework.routers import DefaultRouter

from catalog.views import AlbumViewSet, PlaylistViewSet, RecommendationView, TrackViewSet

router = DefaultRouter()
router.register("tracks", TrackViewSet, basename="track")
router.register("albums", AlbumViewSet, basename="album")
router.register("playlists", PlaylistViewSet, basename="playlist")

urlpatterns = [
    path("recommendations/", RecommendationView.as_view()),
    path("", include(router.urls)),
]
