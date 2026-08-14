from django.contrib import admin

from catalog.models import Album, Playlist, Track

admin.site.register(Track)
admin.site.register(Album)
admin.site.register(Playlist)
