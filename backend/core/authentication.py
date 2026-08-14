from rest_framework_simplejwt.authentication import JWTAuthentication


class ExpiringJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        user.apply_subscription_expiry()
        return user, token
