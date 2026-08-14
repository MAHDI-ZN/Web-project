from django.conf import settings
from django.db import models

from core.validators import validate_audio_file, validate_image_file


class Album(models.Model):
    title = models.CharField(max_length=200)
    artists = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="albums"
    )
    cover = models.ImageField(
        upload_to="covers/albums/", blank=True, null=True, validators=[validate_image_file]
    )
    cover_url = models.URLField(blank=True)
    year = models.PositiveIntegerField()
    genre = models.CharField(max_length=80)
    early_access = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    @property
    def resolved_cover(self):
        if self.cover:
            return self.cover.url
        return self.cover_url


class Track(models.Model):
    title = models.CharField(max_length=200)
    artists = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="tracks"
    )
    album = models.ForeignKey(
        Album, on_delete=models.SET_NULL, blank=True, null=True, related_name="tracks"
    )
    cover = models.ImageField(
        upload_to="covers/tracks/", blank=True, null=True, validators=[validate_image_file]
    )
    cover_url = models.URLField(blank=True)
    audio_file = models.FileField(
        upload_to="audio/", blank=True, null=True, validators=[validate_audio_file]
    )
    audio_url = models.URLField(blank=True)
    lyrics = models.TextField(blank=True)
    genre = models.CharField(max_length=80)
    year = models.PositiveIntegerField()
    streams = models.PositiveIntegerField(default=0)
    listeners = models.PositiveIntegerField(default=0)
    duration = models.PositiveIntegerField(default=0)
    early_access = models.BooleanField(default=False)
    is_single = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    @property
    def resolved_cover(self):
        if self.cover:
            return self.cover.url
        if self.cover_url:
            return self.cover_url
        if self.album:
            return self.album.resolved_cover
        return ""

    @property
    def resolved_audio(self):
        if self.audio_file:
            return self.audio_file.url
        return self.audio_url


class Playlist(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="playlists"
    )
    name = models.CharField(max_length=150)
    cover = models.ImageField(
        upload_to="covers/playlists/", blank=True, null=True, validators=[validate_image_file]
    )
    cover_url = models.URLField(blank=True)
    tracks = models.ManyToManyField(Track, through="PlaylistTrack", related_name="playlists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def resolved_cover(self):
        if self.cover:
            return self.cover.url
        return self.cover_url


class PlaylistTrack(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    position = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["playlist", "track"], name="unique_playlist_track")
        ]
        ordering = ["position", "id"]


class StreamEvent(models.Model):
    """Immutable play event — created via POST only (no PUT/PATCH)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stream_events"
    )
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name="stream_events")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["track", "created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]
