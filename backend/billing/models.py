from django.conf import settings
from django.db import models


class SubscriptionPrice(models.Model):
    """Singleton-style row: admin updates prices without a code change."""

    silver = models.PositiveIntegerField(default=99000)
    gold = models.PositiveIntegerField(default=199000)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "در حال انجام"
        SUCCESS = "success", "موفق"
        FAILED = "failed", "ناموفق"

    class Tier(models.TextChoices):
        SILVER = "silver", "نقره‌ای"
        GOLD = "gold", "طلایی"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payments"
    )
    tier = models.CharField(max_length=20, choices=Tier.choices)
    months = models.PositiveSmallIntegerField()
    amount = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    authority = models.CharField(max_length=128, blank=True, db_index=True)
    gateway = models.CharField(max_length=40, default="mock")
    ref_id = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class ArtistPayout(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "در انتظار پرداخت"
        SETTLED = "settled", "تسویه شده"

    artist = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payouts"
    )
    unique_listeners = models.PositiveIntegerField(default=0)
    streams = models.PositiveIntegerField(default=0)
    amount = models.PositiveIntegerField(default=0)
    payment_status = models.CharField(
        max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )
    month = models.CharField(max_length=7)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["artist", "month"], name="unique_artist_month_payout")
        ]
