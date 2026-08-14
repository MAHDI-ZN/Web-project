from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSelf(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = getattr(obj, "user", obj)
        return getattr(user, "pk", None) == request.user.pk


class IsOwner(BasePermission):
    owner_field = "owner"

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, self.owner_field, None)
        return owner == request.user


class IsArtistApproved(BasePermission):
    message = "فقط هنرمندان تأییدشده به این بخش دسترسی دارند."

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated or user.role != user.Role.ARTIST:
            return False
        profile = getattr(user, "artist_profile", None)
        return bool(profile and profile.is_approved)


class IsSupportOrAdmin(BasePermission):
    message = "فقط پشتیبان یا مدیر سامانه دسترسی دارد."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            request.user.Role.SUPPORT,
            request.user.Role.ADMIN,
        )


class IsAdmin(BasePermission):
    message = "فقط مدیر سامانه دسترسی دارد."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == request.user.Role.ADMIN


class ReadOnlyOrOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, "owner", None) or getattr(obj, "user", None)
        if owner == request.user:
            return True
        if request.user.role == request.user.Role.ADMIN:
            return True
        return False


class CanSeeTrack(BasePermission):
    """Gold-only early-access tracks are hidden from other tiers."""

    def has_object_permission(self, request, view, obj):
        if not getattr(obj, "early_access", False):
            return True
        return request.user.can_see_early_access
