from django.db.models import Q
from django.http import FileResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Album, Playlist, PlaylistTrack, StreamEvent, Track
from catalog.recommendations import RecommendationService
from catalog.serializers import (
    AlbumSerializer,
    PlaylistSerializer,
    TrackSerializer,
    TrackWriteSerializer,
)
from core.permissions import IsArtistApproved
from core.validators import validate_audio_file, validate_image_file
from social.factory import NotificationFactory


def parse_bool(value, default=False):
    if value in (True, False):
        return value
    if isinstance(value, str):
        return value.lower() in ("1", "true", "yes", "on")
    return default


def parse_id_list(data, *keys):
    values = []
    for key in keys:
        raw = data.get(key)
        if raw in (None, ""):
            continue
        if isinstance(raw, list):
            values.extend(raw)
        else:
            values.extend(str(raw).split(","))
        getlist = getattr(data, "getlist", None)
        if getlist:
            values.extend(getlist(key))
    ids = []
    for item in values:
        try:
            ids.append(int(item))
        except (TypeError, ValueError):
            continue
    return list(dict.fromkeys(ids))


def visible_tracks(qs, user):
    if user.can_see_early_access:
        return qs
    return qs.filter(early_access=False)


class TrackViewSet(viewsets.ModelViewSet):
    queryset = Track.objects.all().prefetch_related("artists").select_related("album")
    serializer_class = TrackSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = visible_tracks(super().get_queryset(), self.request.user)
        search = self.request.query_params.get("search")
        ordering = self.request.query_params.get("ordering")
        mine = self.request.query_params.get("mine")
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(artists__display_name__icontains=search)
                | Q(artists__artist_profile__stage_name__icontains=search)
            ).distinct()
        if mine == "1":
            qs = qs.filter(artists=self.request.user)
        if ordering == "listeners":
            qs = qs.order_by("-listeners")
        elif ordering == "created":
            qs = qs.order_by("-created_at")
        else:
            qs = qs.order_by("-streams", "-created_at")
        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsArtistApproved()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        write = TrackWriteSerializer(data=request.data)
        write.is_valid(raise_exception=True)
        audio = request.FILES.get("audio")
        cover = request.FILES.get("cover")
        if not audio and not request.data.get("audio_url") and not request.data.get("audioUrl"):
            return Response({"error": "فایل صوتی الزامی است."}, status=400)
        if audio:
            try:
                validate_audio_file(audio)
            except Exception as exc:
                return Response({"error": str(exc)}, status=400)
        if cover:
            try:
                validate_image_file(cover)
            except Exception as exc:
                return Response({"error": str(exc)}, status=400)

        data = write.validated_data
        album = None
        album_id = data.get("album_id") or request.data.get("album_id") or request.data.get("albumId")
        if album_id:
            album = Album.objects.filter(pk=album_id, artists=request.user).first()
            if not album:
                return Response({"error": "آلبوم یافت نشد."}, status=400)

        track = Track.objects.create(
            title=data["title"],
            genre=data["genre"],
            year=data["year"],
            lyrics=data.get("lyrics", ""),
            is_single=parse_bool(request.data.get("is_single", data.get("is_single", True)), True),
            early_access=parse_bool(request.data.get("early_access", data.get("early_access", False))),
            duration=data.get("duration", 0),
            album=album,
            audio_file=audio,
            cover=cover,
            audio_url=request.data.get("audio_url") or request.data.get("audioUrl") or "",
        )
        ids = [request.user.pk, *parse_id_list(request.data, "collaborator_ids", "collaboratorIds")]
        track.artists.set(ids)
        NotificationFactory.new_release(request.user, track.title)
        return Response(
            TrackSerializer(track, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        track = self.get_object()
        if not track.artists.filter(pk=request.user.pk).exists():
            return Response({"error": "فقط هنرمند اثر می‌تواند آن را ویرایش کند."}, status=403)
        write = TrackWriteSerializer(data=request.data, partial=True)
        write.is_valid(raise_exception=True)
        data = write.validated_data
        for field in ("title", "genre", "year", "lyrics", "is_single", "early_access", "duration"):
            if field in data:
                setattr(track, field, data[field])
        audio = request.FILES.get("audio")
        cover = request.FILES.get("cover")
        if audio:
            validate_audio_file(audio)
            track.audio_file = audio
        if cover:
            validate_image_file(cover)
            track.cover = cover
        if "collaborator_ids" in data or "collaboratorIds" in request.data:
            track.artists.set([request.user.pk, *parse_id_list(request.data, "collaborator_ids", "collaboratorIds")])
        track.save()
        return Response(TrackSerializer(track, context={"request": request}).data)

    def destroy(self, request, *args, **kwargs):
        track = self.get_object()
        if not track.artists.filter(pk=request.user.pk).exists() and request.user.role != request.user.Role.ADMIN:
            return Response({"error": "اجازه حذف این اثر را ندارید."}, status=403)
        track.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def stream(self, request, pk=None):
        track = self.get_object()
        user = request.user
        if not user.can_stream_now():
            return Response(
                {"error": "سقف استریم روزانه اشتراک پایه به پایان رسیده است."},
                status=status.HTTP_403_FORBIDDEN,
            )
        already = StreamEvent.objects.filter(user=user, track=track).exists()
        StreamEvent.objects.create(user=user, track=track)
        user.reset_daily_stream_if_needed()
        user.daily_stream_count += 1
        user.save(update_fields=["daily_stream_count", "daily_stream_date"])
        track.streams += 1
        if not already:
            track.listeners += 1
        track.save(update_fields=["streams", "listeners"])
        return Response({"ok": True, "dailyStreamCount": user.daily_stream_count})

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        if not request.user.can_download:
            return Response({"error": "دانلود فقط برای اشتراک نقره‌ای و طلایی است."}, status=403)
        track = self.get_object()
        if track.audio_file:
            return FileResponse(track.audio_file.open("rb"), as_attachment=True, filename=track.audio_file.name)
        if track.audio_url:
            return Response({"url": track.audio_url})
        return Response({"error": "فایل صوتی موجود نیست."}, status=404)


class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.all().prefetch_related("artists", "tracks")
    serializer_class = AlbumSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.can_see_early_access:
            qs = qs.filter(early_access=False)
        search = self.request.query_params.get("search")
        ordering = self.request.query_params.get("ordering")
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(artists__display_name__icontains=search)
                | Q(artists__artist_profile__stage_name__icontains=search)
            ).distinct()
        if ordering == "created":
            qs = qs.order_by("-created_at")
        else:
            qs = qs.order_by("-created_at")
        return qs

    def get_permissions(self):
        if self.action in ("create", "partial_update", "destroy"):
            return [IsAuthenticated(), IsArtistApproved()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        title = (request.data.get("title") or "").strip()
        genre = request.data.get("genre") or "پاپ"
        year = int(request.data.get("year") or 2026)
        if not title:
            return Response({"error": "عنوان آلبوم الزامی است."}, status=400)
        cover = request.FILES.get("cover")
        album = Album.objects.create(title=title, genre=genre, year=year, cover=cover)
        album.artists.add(request.user)
        return Response(AlbumSerializer(album, context={"request": request}).data, status=201)

    def partial_update(self, request, *args, **kwargs):
        album = self.get_object()
        if not album.artists.filter(pk=request.user.pk).exists():
            return Response({"error": "اجازه ویرایش این آلبوم را ندارید."}, status=403)
        for field in ("title", "genre", "year", "early_access"):
            if field in request.data:
                setattr(album, field, request.data.get(field))
        if request.FILES.get("cover"):
            album.cover = request.FILES["cover"]
        album.save()
        return Response(AlbumSerializer(album, context={"request": request}).data)

    def destroy(self, request, *args, **kwargs):
        album = self.get_object()
        if not album.artists.filter(pk=request.user.pk).exists() and request.user.role != request.user.Role.ADMIN:
            return Response({"error": "اجازه حذف ندارید."}, status=403)
        album.delete()
        return Response(status=204)


class PlaylistViewSet(viewsets.ModelViewSet):
    serializer_class = PlaylistSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Playlist.objects.filter(owner=self.request.user).prefetch_related("tracks")
        return qs

    def create(self, request, *args, **kwargs):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "نام پلی‌لیست الزامی است."}, status=400)
        count = Playlist.objects.filter(owner=request.user).count()
        if request.user.playlist_limit_reached(count):
            return Response(
                {"error": "به سقف تعداد پلی‌لیست اشتراک خود رسیده‌اید."},
                status=403,
            )
        playlist = Playlist.objects.create(owner=request.user, name=name)
        return Response(PlaylistSerializer(playlist, context={"request": request}).data, status=201)

    def partial_update(self, request, *args, **kwargs):
        playlist = self.get_object()
        name = (request.data.get("name") or "").strip()
        if name:
            playlist.name = name
            playlist.save(update_fields=["name", "updated_at"])
        return Response(PlaylistSerializer(playlist, context={"request": request}).data)

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return Response(status=204)

    @action(detail=True, methods=["post"], url_path="tracks")
    def add_track(self, request, pk=None):
        playlist = self.get_object()
        track_id = request.data.get("trackId") or request.data.get("track_id")
        try:
            track = Track.objects.get(pk=track_id)
        except (Track.DoesNotExist, ValueError, TypeError):
            return Response({"error": "آهنگ یافت نشد."}, status=404)
        PlaylistTrack.objects.get_or_create(
            playlist=playlist,
            track=track,
            defaults={"position": playlist.tracks.count()},
        )
        return Response(PlaylistSerializer(playlist, context={"request": request}).data)

    @action(detail=True, methods=["delete"], url_path=r"tracks/(?P<track_id>[^/.]+)")
    def remove_track(self, request, pk=None, track_id=None):
        playlist = self.get_object()
        PlaylistTrack.objects.filter(playlist=playlist, track_id=track_id).delete()
        return Response(PlaylistSerializer(playlist, context={"request": request}).data)


class RecommendationView(APIView):
    def get(self, request):
        tracks = RecommendationService().for_user(request.user)
        return Response(TrackSerializer(tracks, many=True, context={"request": request}).data)
