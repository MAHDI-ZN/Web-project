from django.contrib import admin

from accounts.models import ArtistProfile, Follow, User


class ArtistProfileInline(admin.StackedInline):
    model = ArtistProfile
    extra = 0


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "display_name", "role", "subscription_tier")
    search_fields = ("email", "display_name", "username")
    inlines = [ArtistProfileInline]


admin.site.register(Follow)
