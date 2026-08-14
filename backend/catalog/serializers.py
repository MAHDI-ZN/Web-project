from rest_framework import serializers

from accounts.serializers import media_url
from catalog.models import Album, Playlist, Track


class ArtistMiniSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    display_name = serializers.CharField()
    stage_name = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.pk)

    def get_stage_name(self, obj):
        profile = getattr(obj, "artist_profile", None)
        return profile.stage_name if profile else obj.display_name


class TrackSerializer(serializers.ModelSerializer):
    artist_ids = serializers.SerializerMethodField()
    artists = serializers.SerializerMethodField()
    album_id = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = (
            "id",
            "title",
            "artist_ids",
            "artists",
            "album_id",
            "cover",
            "audio_url",
            "lyrics",
            "genre",
            "year",
            "streams",
            "listeners",
            "duration",
            "early_access",
            "is_single",
            "created_at",
        )
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.pk)
        return data

    def get_artist_ids(self, obj):
        return [str(pk) for pk in obj.artists.values_list("id", flat=True)]

    def get_artists(self, obj):
        return ArtistMiniSerializer(obj.artists.all(), many=True).data

    def get_album_id(self, obj):
        return str(obj.album_id) if obj.album_id else None

    def get_cover(self, obj):
        return media_url(self.context.get("request"), obj.resolved_cover)

    def get_audio_url(self, obj):
        return media_url(self.context.get("request"), obj.resolved_audio)


class TrackWriteSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    genre = serializers.CharField(max_length=80)
    year = serializers.IntegerField(min_value=1900, max_value=2100)
    lyrics = serializers.CharField(required=False, allow_blank=True)
    is_single = serializers.BooleanField(required=False, default=True)
    early_access = serializers.BooleanField(required=False, default=False)
    album_id = serializers.IntegerField(required=False, allow_null=True)
    duration = serializers.IntegerField(required=False, min_value=0)


class AlbumSerializer(serializers.ModelSerializer):
    artist_ids = serializers.SerializerMethodField()
    artists = serializers.SerializerMethodField()
    track_ids = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = (
            "id",
            "title",
            "artist_ids",
            "artists",
            "cover",
            "year",
            "track_ids",
            "genre",
            "early_access",
            "created_at",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.pk)
        return data

    def get_artist_ids(self, obj):
        return [str(pk) for pk in obj.artists.values_list("id", flat=True)]

    def get_artists(self, obj):
        return ArtistMiniSerializer(obj.artists.all(), many=True).data

    def get_track_ids(self, obj):
        return [str(pk) for pk in obj.tracks.values_list("id", flat=True)]

    def get_cover(self, obj):
        return media_url(self.context.get("request"), obj.resolved_cover)


class PlaylistSerializer(serializers.ModelSerializer):
    owner_id = serializers.SerializerMethodField()
    track_ids = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = ("id", "owner_id", "name", "track_ids", "cover", "created_at", "updated_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(instance.pk)
        return data

    def get_owner_id(self, obj):
        return str(obj.owner_id)

    def get_track_ids(self, obj):
        return [str(pk) for pk in obj.tracks.values_list("id", flat=True)]

    def get_cover(self, obj):
        return media_url(self.context.get("request"), obj.resolved_cover)
