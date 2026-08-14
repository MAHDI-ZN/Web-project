class SubscriptionExpiryMiddleware:
    """Downgrade expired paid subscriptions to basic without a code change per user."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            user.apply_subscription_expiry()
        return self.get_response(request)
