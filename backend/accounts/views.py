import secrets

from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import ArtistProfile, Follow, PasswordResetToken, User
from accounts.serializers import (
    LoginSerializer,
    MeUpdateSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetSerializer,
    PublicUserSerializer,
    RegisterArtistSerializer,
    RegisterListenerSerializer,
    UserSettingsSerializer,
)
from core.permissions import IsSupportOrAdmin
from core.validators import validate_image_file
from social.factory import NotificationFactory


def username_from_email(email: str) -> str:
    base = "".join(ch if ch.isalnum() or ch == "_" else "_" for ch in email.split("@")[0].lower())
    candidate = base
    n = 1
    while User.objects.filter(username=candidate).exists():
        n += 1
        candidate = f"{base}_{n}"
    return candidate


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterListenerView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterListenerSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
            display_name=data["display_name"],
            username=username_from_email(data["email"]),
            birth_date=data["birth_date"],
            gender=data["gender"],
            role=User.Role.LISTENER,
        )
        return Response(
            {**tokens_for(user), "user": PublicUserSerializer(user, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )


class RegisterArtistView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterArtistSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
            display_name=data["stage_name"],
            username=username_from_email(data["email"]),
            role=User.Role.ARTIST,
        )
        ArtistProfile.objects.create(
            user=user,
            stage_name=data["stage_name"],
            sample_works=data["sample_works"],
            status=ArtistProfile.Status.PENDING,
        )
        NotificationFactory.artist_pending(user)
        return Response(
            {**tokens_for(user), "user": PublicUserSerializer(user, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email__iexact=ser.validated_data["email"])
        except User.DoesNotExist:
            return Response({"error": "ایمیل یا رمز عبور نادرست است."}, status=400)
        if not user.check_password(ser.validated_data["password"]):
            return Response({"error": "ایمیل یا رمز عبور نادرست است."}, status=400)
        user.apply_subscription_expiry()
        return Response(
            {**tokens_for(user), "user": PublicUserSerializer(user, context={"request": request}).data}
        )


class MeView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        request.user.apply_subscription_expiry()
        return Response(PublicUserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        ser = MeUpdateSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        user = request.user
        data = ser.validated_data
        if "display_name" in data:
            user.display_name = data["display_name"]
        if "gender" in data:
            user.gender = data["gender"]
        if "birth_date" in data:
            user.birth_date = data["birth_date"]
        user.save()
        if "bio" in data and hasattr(user, "artist_profile"):
            user.artist_profile.bio = data["bio"]
            user.artist_profile.save(update_fields=["bio"])
        return Response(PublicUserSerializer(user, context={"request": request}).data)

    def delete(self, request):
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeSettingsView(APIView):
    def patch(self, request):
        ser = UserSettingsSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        user = request.user
        for field, value in ser.validated_data.items():
            setattr(user, field, value)
        user.save()
        return Response(PublicUserSerializer(user, context={"request": request}).data)


class MeAvatarView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not request.user.can_upload_avatar:
            return Response(
                {"error": "اشتراک پایه امکان آپلود عکس نمایه ندارد."},
                status=status.HTTP_403_FORBIDDEN,
            )
        file = request.FILES.get("avatar")
        if not file:
            return Response({"error": "فایل تصویر الزامی است."}, status=400)
        try:
            validate_image_file(file)
        except Exception as exc:
            return Response({"error": str(exc)}, status=400)
        request.user.avatar = file
        request.user.save(update_fields=["avatar"])
        return Response(PublicUserSerializer(request.user, context={"request": request}).data)


class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PasswordResetSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()
        if user:
            token = secrets.token_urlsafe(24)
            PasswordResetToken.objects.create(user=user, token=token)
            link = f"{settings.FRONTEND_URL}/forgot-password?token={token}"
            send_mail(
                "بازیابی رمز عبور Melody",
                f"برای تنظیم رمز جدید از این لینک استفاده کنید:\n{link}",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
        return Response(
            {"message": "اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود."}
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = PasswordResetConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        token = PasswordResetToken.objects.filter(
            token=ser.validated_data["token"], used=False
        ).first()
        if not token:
            return Response({"error": "توکن نامعتبر است."}, status=400)
        token.user.set_password(ser.validated_data["password"])
        token.user.save()
        token.used = True
        token.save(update_fields=["used"])
        return Response({"message": "رمز عبور به‌روز شد."})


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().select_related("artist_profile")
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        role = self.request.query_params.get("role")
        if search:
            qs = qs.filter(display_name__icontains=search) | qs.filter(
                username__icontains=search
            ) | qs.filter(artist_profile__stage_name__icontains=search)
        if role:
            qs = qs.filter(role=role)
        return qs.distinct()

    @action(detail=True, methods=["post"])
    def follow(self, request, pk=None):
        target = self.get_object()
        if target.pk == request.user.pk:
            return Response({"error": "نمی‌توانید خود را دنبال کنید."}, status=400)
        Follow.objects.get_or_create(follower=request.user, following=target)
        return Response(PublicUserSerializer(target, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def unfollow(self, request, pk=None):
        target = self.get_object()
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response(PublicUserSerializer(target, context={"request": request}).data)


class ArtistRequestViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSupportOrAdmin]
    serializer_class = PublicUserSerializer

    def get_queryset(self):
        return User.objects.filter(role=User.Role.ARTIST, artist_profile__isnull=False).select_related(
            "artist_profile"
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        user = self.get_object()
        profile = user.artist_profile
        profile.status = ArtistProfile.Status.APPROVED
        profile.verified = True
        profile.rejection_reason = ""
        profile.save()
        NotificationFactory.artist_approved(user)
        return Response(PublicUserSerializer(user, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        reason = (request.data.get("reason") or "").strip()
        if not reason:
            return Response({"error": "علت رد الزامی است."}, status=400)
        user = self.get_object()
        profile = user.artist_profile
        profile.status = ArtistProfile.Status.REJECTED
        profile.verified = False
        profile.rejection_reason = reason
        profile.save()
        NotificationFactory.artist_rejected(user, reason)
        return Response(PublicUserSerializer(user, context={"request": request}).data)
