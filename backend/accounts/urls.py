from django.urls import path

from accounts.views import (
    LoginView,
    MeAvatarView,
    MeSettingsView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetView,
    RegisterArtistView,
    RegisterListenerView,
)

urlpatterns = [
    path("register/", RegisterListenerView.as_view()),
    path("register-artist/", RegisterArtistView.as_view()),
    path("login/", LoginView.as_view()),
    path("password-reset/", PasswordResetView.as_view()),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view()),
    path("me/", MeView.as_view()),
    path("me/settings/", MeSettingsView.as_view()),
    path("me/avatar/", MeAvatarView.as_view()),
]
