import io

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient, APITestCase

from accounts.models import ArtistProfile, User
from billing.models import Payment, SubscriptionPrice
from catalog.models import Playlist, Track
from social.models import Notification, Ticket


def make_user(email, password="demo1234", **kwargs):
    defaults = {
        "username": email.split("@")[0],
        "display_name": email.split("@")[0],
        "role": User.Role.LISTENER,
    }
    defaults.update(kwargs)
    return User.objects.create_user(email=email, password=password, **defaults)


class AuthTests(APITestCase):
    def test_register_listener_and_login(self):
        res = self.client.post(
            "/api/auth/register/",
            {
                "displayName": "تست کاربر",
                "email": "testuser@example.com",
                "password": "secret12",
                "birthDate": "2000-01-01",
                "gender": "other",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["subscription_tier"], "basic")
        self.assertTrue(res.data["user"]["username"])

        login = self.client.post(
            "/api/auth/login/",
            {"email": "testuser@example.com", "password": "secret12"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertIn("access", login.data)

    def test_login_rejects_bad_password(self):
        make_user("nima@demo.com")
        res = self.client.post(
            "/api/auth/login/",
            {"email": "nima@demo.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_duplicate_email_rejected(self):
        make_user("dup@demo.com")
        res = self.client.post(
            "/api/auth/register/",
            {
                "displayName": "دیگر",
                "email": "dup@demo.com",
                "password": "secret12",
                "birthDate": "2000-01-01",
                "gender": "male",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_settings_sync_across_me_endpoint(self):
        user = make_user("set@demo.com")
        self.client.force_authenticate(user)
        res = self.client.patch(
            "/api/auth/me/settings/",
            {"notificationsEnabled": False, "volume": 0.4, "language": "en"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        user.refresh_from_db()
        self.assertFalse(user.notifications_enabled)
        self.assertEqual(user.volume, 0.4)
        self.assertEqual(user.language, "en")


class PermissionTests(APITestCase):
    def setUp(self):
        self.basic = make_user("basic@demo.com", subscription_tier=User.Tier.BASIC)
        self.gold = make_user("gold@demo.com", subscription_tier=User.Tier.GOLD)
        self.support = make_user("sup@demo.com", role=User.Role.SUPPORT)
        self.admin = make_user("adm@demo.com", role=User.Role.ADMIN, is_staff=True)
        self.artist = make_user("art@demo.com", role=User.Role.ARTIST)
        ArtistProfile.objects.create(
            user=self.artist, stage_name="هنرمند", status=ArtistProfile.Status.APPROVED, verified=True
        )
        self.pending = make_user("pend@demo.com", role=User.Role.ARTIST)
        ArtistProfile.objects.create(
            user=self.pending, stage_name="منتظر", status=ArtistProfile.Status.PENDING
        )

    def test_support_cannot_update_prices(self):
        SubscriptionPrice.get_solo()
        self.client.force_authenticate(self.support)
        res = self.client.put("/api/prices/", {"silver": 1, "gold": 2}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_admin_can_update_prices(self):
        SubscriptionPrice.get_solo()
        self.client.force_authenticate(self.admin)
        res = self.client.put("/api/prices/", {"silver": 111000, "gold": 222000}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["silver"], 111000)

    def test_pending_artist_cannot_publish(self):
        self.client.force_authenticate(self.pending)
        res = self.client.post(
            "/api/tracks/",
            {"title": "x", "genre": "پاپ", "year": 2026, "audioUrl": "http://example.com/a.mp3"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_basic_cannot_upload_avatar(self):
        self.client.force_authenticate(self.basic)
        image = SimpleUploadedFile("a.png", b"\x89PNG\r\n\x1a\n" + b"0" * 20, content_type="image/png")
        res = self.client.post("/api/auth/me/avatar/", {"avatar": image}, format="multipart")
        self.assertEqual(res.status_code, 403)

    def test_user_cannot_follow_self(self):
        self.client.force_authenticate(self.basic)
        res = self.client.post(f"/api/users/{self.basic.pk}/follow/")
        self.assertEqual(res.status_code, 400)

    def test_approve_artist_notifies(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(f"/api/artist-requests/{self.pending.pk}/approve/")
        self.assertEqual(res.status_code, 200)
        self.pending.artist_profile.refresh_from_db()
        self.assertEqual(self.pending.artist_profile.status, "approved")
        self.assertTrue(
            Notification.objects.filter(user=self.pending, title="حساب تأیید شد").exists()
        )


class CatalogBillingTests(APITestCase):
    def setUp(self):
        self.basic = make_user("b@demo.com", subscription_tier=User.Tier.BASIC)
        self.gold = make_user("g@demo.com", subscription_tier=User.Tier.GOLD)
        self.artist = make_user("ar@demo.com", role=User.Role.ARTIST)
        ArtistProfile.objects.create(
            user=self.artist,
            stage_name="آوا",
            status=ArtistProfile.Status.APPROVED,
            verified=True,
        )
        self.track = Track.objects.create(
            title="سپیده",
            genre="پاپ",
            year=2025,
            audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            cover_url="https://picsum.photos/seed/t/400/400",
            duration=120,
        )
        self.track.artists.add(self.artist)
        self.early = Track.objects.create(
            title="زودهنگام",
            genre="ایندی",
            year=2026,
            audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            early_access=True,
            is_single=True,
        )
        self.early.artists.add(self.artist)

    def test_playlist_limit_for_basic(self):
        self.client.force_authenticate(self.basic)
        for i in range(6):
            res = self.client.post("/api/playlists/", {"name": f"p{i}"}, format="json")
            self.assertEqual(res.status_code, 201, res.data)
        blocked = self.client.post("/api/playlists/", {"name": "extra"}, format="json")
        self.assertEqual(blocked.status_code, 403)

    def test_gold_playlist_unlimited_small_batch(self):
        self.client.force_authenticate(self.gold)
        for i in range(8):
            res = self.client.post("/api/playlists/", {"name": f"g{i}"}, format="json")
            self.assertEqual(res.status_code, 201)

    def test_basic_stream_limit(self):
        self.basic.daily_stream_count = 60
        self.basic.save()
        self.client.force_authenticate(self.basic)
        res = self.client.post(f"/api/tracks/{self.track.pk}/stream/")
        self.assertEqual(res.status_code, 403)

    def test_gold_can_stream_and_increments(self):
        self.client.force_authenticate(self.gold)
        res = self.client.post(f"/api/tracks/{self.track.pk}/stream/")
        self.assertEqual(res.status_code, 200)
        self.track.refresh_from_db()
        self.assertEqual(self.track.streams, 1)
        self.assertEqual(self.track.listeners, 1)

    def test_early_access_hidden_from_basic(self):
        self.client.force_authenticate(self.basic)
        res = self.client.get("/api/tracks/")
        ids = [row["id"] for row in res.data]
        self.assertNotIn(str(self.early.pk), ids)

    def test_early_access_visible_to_gold(self):
        self.client.force_authenticate(self.gold)
        res = self.client.get("/api/tracks/")
        ids = [row["id"] for row in res.data]
        self.assertIn(str(self.early.pk), ids)

    def test_download_forbidden_for_basic(self):
        self.client.force_authenticate(self.basic)
        res = self.client.get(f"/api/tracks/{self.track.pk}/download/")
        self.assertEqual(res.status_code, 403)

    def test_stream_has_no_put(self):
        self.client.force_authenticate(self.gold)
        res = self.client.put(f"/api/tracks/{self.track.pk}/stream/", {}, format="json")
        self.assertEqual(res.status_code, 405)

    def test_payment_initiate_and_verify_mock(self):
        SubscriptionPrice.get_solo()
        self.client.force_authenticate(self.basic)
        init = self.client.post(
            "/api/payments/initiate/", {"tier": "silver", "months": 3}, format="json"
        )
        self.assertEqual(init.status_code, 201)
        authority = init.data["authority"]
        verify = self.client.post(
            "/api/payments/verify/",
            {"authority": authority, "status": "OK"},
            format="json",
        )
        self.assertEqual(verify.status_code, 200)
        self.basic.refresh_from_db()
        self.assertEqual(self.basic.subscription_tier, User.Tier.SILVER)
        self.assertEqual(Payment.objects.get(authority=authority).status, Payment.Status.SUCCESS)

    def test_admin_report_is_aggregated(self):
        admin = make_user("admin2@demo.com", role=User.Role.ADMIN)
        self.client.force_authenticate(admin)
        res = self.client.get("/api/reports/admin/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("userCount", res.data)
        self.assertIn("subscriptionDistribution", res.data)
        self.assertNotIn("results", res.data)

    def test_recommendations_not_empty_and_exclude_unseen_early_for_basic(self):
        self.client.force_authenticate(self.basic)
        self.client.post(f"/api/tracks/{self.track.pk}/stream/")
        res = self.client.get("/api/recommendations/")
        self.assertEqual(res.status_code, 200)
        ids = [row["id"] for row in res.data]
        self.assertNotIn(str(self.early.pk), ids)

    def test_file_upload_rejects_bad_audio_extension(self):
        self.client.force_authenticate(self.artist)
        bad = SimpleUploadedFile("song.txt", b"hello", content_type="text/plain")
        res = self.client.post(
            "/api/tracks/",
            {"title": "بد", "genre": "پاپ", "year": 2026, "audio": bad},
            format="multipart",
        )
        self.assertEqual(res.status_code, 400)

    def test_ticket_create_and_staff_reply(self):
        self.client.force_authenticate(self.basic)
        created = self.client.post(
            "/api/tickets/",
            {"subject": "کمک", "body": "پخش کار نمی‌کند"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        ticket_id = created.data["id"]
        support = make_user("s2@demo.com", role=User.Role.SUPPORT)
        self.client.force_authenticate(support)
        reply = self.client.post(
            f"/api/tickets/{ticket_id}/messages/",
            {"body": "بررسی شد"},
            format="json",
        )
        self.assertEqual(reply.status_code, 200)
        self.assertEqual(reply.data["status"], "answered")

    def test_cannot_delete_someone_elses_playlist(self):
        other = Playlist.objects.create(owner=self.gold, name="مال دیگری")
        self.client.force_authenticate(self.basic)
        res = self.client.delete(f"/api/playlists/{other.pk}/")
        self.assertEqual(res.status_code, 404)
