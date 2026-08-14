from datetime import date

from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models

from core.policies import entitlements_for


class UserManager(DjangoUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("ایمیل الزامی است.")
        extra.setdefault("username", extra.get("username") or email.split("@")[0])
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("role", User.Role.ADMIN)
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("display_name", extra.get("display_name") or "Admin")
        return self.create_user(email, password, **extra)


class User(AbstractUser):
    class Role(models.TextChoices):
        LISTENER = "listener", "شنونده"
        ARTIST = "artist", "هنرمند"
        SUPPORT = "support", "پشتیبان"
        ADMIN = "admin", "مدیر"

    class Gender(models.TextChoices):
        MALE = "male", "مرد"
        FEMALE = "female", "زن"
        OTHER = "other", "سایر"
        PREFER_NOT = "prefer_not", "ترجیح می‌دهم نگویم"

    class Tier(models.TextChoices):
        BASIC = "basic", "پایه"
        SILVER = "silver", "نقره‌ای"
        GOLD = "gold", "طلایی"

    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=150)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True)
    birth_date = models.DateField(blank=True, null=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.LISTENER)
    subscription_tier = models.CharField(
        max_length=20, choices=Tier.choices, default=Tier.BASIC
    )
    subscription_expires_at = models.DateField(blank=True, null=True)
    daily_stream_count = models.PositiveIntegerField(default=0)
    daily_stream_date = models.DateField(default=date.today)
    notifications_enabled = models.BooleanField(default=True)
    volume = models.FloatField(default=0.8)
    language = models.CharField(max_length=8, default="fa")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "display_name"]
    objects = UserManager()

    def __str__(self):
        return self.email

    def apply_subscription_expiry(self):
        if (
            self.subscription_tier != self.Tier.BASIC
            and self.subscription_expires_at
            and self.subscription_expires_at < date.today()
        ):
            self.subscription_tier = self.Tier.BASIC
            self.save(update_fields=["subscription_tier"])

    @property
    def entitlements(self):
        return entitlements_for(self.subscription_tier)

    @property
    def can_upload_avatar(self):
        return self.entitlements.avatar

    @property
    def can_download(self):
        return self.entitlements.download

    @property
    def can_see_early_access(self):
        return self.entitlements.early_access

    @property
    def can_see_stats(self):
        return self.entitlements.stats

    def reset_daily_stream_if_needed(self):
        today = date.today()
        if self.daily_stream_date != today:
            self.daily_stream_count = 0
            self.daily_stream_date = today
            self.save(update_fields=["daily_stream_count", "daily_stream_date"])

    def can_stream_now(self) -> bool:
        self.reset_daily_stream_if_needed()
        limit = self.entitlements.daily_streams
        return self.daily_stream_count < limit

    def playlist_limit_reached(self, current_count: int) -> bool:
        return current_count >= self.entitlements.playlists


class ArtistProfile(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در انتظار تأیید"
        APPROVED = "approved", "تأییدشده"
        REJECTED = "rejected", "رد شده"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="artist_profile")
    bio = models.TextField(blank=True)
    verified = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    sample_works = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    stage_name = models.CharField(max_length=150)

    @property
    def is_approved(self):
        return self.status == self.Status.APPROVED

    def __str__(self):
        return self.stage_name


class Follow(models.Model):
    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following_rels"
    )
    following = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="follower_rels"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"], name="unique_follow"
            )
        ]


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_tokens")
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
