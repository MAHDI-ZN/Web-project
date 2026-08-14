"""Factory: create role-specific notifications without duplicating create() calls."""

from accounts.models import User
from social.models import Notification


class NotificationFactory:
    @staticmethod
    def create(user, title, body, href=""):
        if user is None:
            return None
        if getattr(user, "notifications_enabled", True) is False and user.role == User.Role.LISTENER:
            return None
        return Notification.objects.create(user=user, title=title, body=body, href=href)

    @classmethod
    def artist_pending(cls, artist):
        cls.create(
            artist,
            "درخواست ارسال شد",
            "حساب هنرمندی شما در وضعیت «در انتظار تأیید» است.",
        )
        cls.notify_staff(
            "درخواست هنرمند جدید",
            f"{artist.display_name} درخواست تأیید داده است.",
            href="/admin/artist-requests",
        )

    @classmethod
    def artist_approved(cls, artist):
        cls.create(
            artist,
            "حساب تأیید شد",
            "حساب هنرمندی شما تأیید شد. می‌توانید آثار خود را منتشر کنید.",
            href="/artist-panel",
        )

    @classmethod
    def artist_rejected(cls, artist, reason):
        cls.create(artist, "درخواست رد شد", f"علت رد: {reason}")

    @classmethod
    def new_release(cls, artist, track_title):
        followers = User.objects.filter(
            following_rels__following=artist, role=User.Role.LISTENER
        )
        for follower in followers:
            cls.create(
                follower,
                "اثر جدید",
                f"{artist.display_name} اثر جدیدی منتشر کرد: {track_title}",
                href="/browse",
            )

    @classmethod
    def ticket_created(cls, ticket):
        cls.notify_staff(
            "تیکت جدید",
            f"تیکت «{ticket.subject}» ثبت شد.",
            href="/admin/tickets",
        )

    @classmethod
    def ticket_replied(cls, ticket):
        cls.create(
            ticket.user,
            "پاسخ تیکت",
            "پشتیبان به تیکت شما پاسخ داد.",
            href="/settings",
        )

    @classmethod
    def payout_ready(cls, artist, month, amount):
        cls.create(
            artist,
            "محاسبات مالی ماهانه",
            f"پاداش ماه {month}: {amount:,} تومان.",
            href="/artist-panel",
        )

    @classmethod
    def subscription_expiring(cls, user, expires_at):
        cls.create(
            user,
            "مهلت اشتراک",
            f"اشتراک شما تا {expires_at} معتبر است. برای تمدید اقدام کنید.",
            href="/settings",
        )

    @classmethod
    def notify_staff(cls, title, body, href=""):
        staff = User.objects.filter(role__in=[User.Role.SUPPORT, User.Role.ADMIN])
        for user in staff:
            Notification.objects.create(user=user, title=title, body=body, href=href)
