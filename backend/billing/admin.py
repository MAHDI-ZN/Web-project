from django.contrib import admin

from billing.models import ArtistPayout, Payment, SubscriptionPrice

admin.site.register(SubscriptionPrice)
admin.site.register(Payment)
admin.site.register(ArtistPayout)
