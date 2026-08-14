from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from accounts.models import ArtistProfile, User


def media_url(request, path):
    if not path:
        return ""
    if str(path).startswith("http"):
        return path
    return request.build_absolute_uri(path) if request else path


class ArtistProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistProfile
        fields = ("bio", "verified", "status", "sample_works", "rejection_reason", "stage_name")


class UserSettingsSerializer(serializers.Serializer):
    notifications_enabled = serializers.BooleanField()
    volume = serializers.FloatField(min_value=0, max_value=1)
    language = serializers.ChoiceField(choices=["fa", "en"])


class PublicUserSerializer(serializers.ModelSerializer):
    artist_profile = ArtistProfileSerializer(read_only=True)
    avatar = serializers.SerializerMethodField()
    followers = serializers.SerializerMethodField()
    following = serializers.SerializerMethodField()
    settings = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "role",
            "display_name",
            "username",
            "email",
            "avatar",
            "gender",
            "birth_date",
            "subscription_tier",
            "subscription_expires_at",
            "followers",
            "following",
            "daily_stream_count",
            "daily_stream_date",
            "settings",
            "artist_profile",
            "date_joined",
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        viewer = getattr(request, "user", None)
        data["id"] = str(instance.pk)
        data["createdAt"] = instance.date_joined.isoformat()
        data.pop("date_joined", None)
        if viewer and viewer.is_authenticated:
            is_self = viewer.pk == instance.pk
            is_staff = viewer.role in (User.Role.SUPPORT, User.Role.ADMIN)
            if not is_self and not is_staff:
                data.pop("email", None)
                data["daily_stream_count"] = 0
        return data

    def get_avatar(self, obj):
        if obj.avatar:
            return media_url(self.context.get("request"), obj.avatar.url)
        return ""

    def get_followers(self, obj):
        return [str(pk) for pk in obj.follower_rels.values_list("follower_id", flat=True)]

    def get_following(self, obj):
        return [str(pk) for pk in obj.following_rels.values_list("following_id", flat=True)]

    def get_settings(self, obj):
        return {
            "notifications_enabled": obj.notifications_enabled,
            "volume": obj.volume,
            "language": obj.language,
        }


class MeUpdateSerializer(serializers.Serializer):
    display_name = serializers.CharField(required=False, min_length=2)
    gender = serializers.ChoiceField(choices=User.Gender.choices, required=False)
    birth_date = serializers.DateField(required=False)
    bio = serializers.CharField(required=False, allow_blank=True)


class RegisterListenerSerializer(serializers.Serializer):
    display_name = serializers.CharField(min_length=2)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    birth_date = serializers.DateField()
    gender = serializers.ChoiceField(choices=User.Gender.choices)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است.")
        return value.lower()

    def validate_password(self, value):
        validate_password(value)
        return value


class RegisterArtistSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    stage_name = serializers.CharField(min_length=2)
    sample_works = serializers.CharField(min_length=3)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است.")
        return value.lower()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=6)
