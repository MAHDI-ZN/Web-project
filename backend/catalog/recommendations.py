"""Content + collaborative recommendations — scores, not random shuffle."""

from collections import Counter

from django.db.models import Count

from catalog.models import StreamEvent, Track


class RecommendationService:
    def for_user(self, user, limit=8):
        history = (
            StreamEvent.objects.filter(user=user)
            .values_list("track_id", "track__genre")
        )
        played_ids = {row[0] for row in history}
        genres = Counter(row[1] for row in history if row[1])
        followed_ids = list(user.following_rels.values_list("following_id", flat=True))

        qs = Track.objects.all()
        if not user.can_see_early_access:
            qs = qs.filter(early_access=False)
        if played_ids:
            qs = qs.exclude(pk__in=played_ids)

        similar_users = (
            StreamEvent.objects.filter(track_id__in=played_ids)
            .exclude(user=user)
            .values_list("user_id", flat=True)
            .distinct()
        )
        collab_counts = dict(
            StreamEvent.objects.filter(user_id__in=similar_users)
            .exclude(track_id__in=played_ids)
            .values("track_id")
            .annotate(c=Count("id"))
            .values_list("track_id", "c")
        )

        scored = []
        for track in qs.select_related("album").prefetch_related("artists")[:200]:
            score = 0.0
            artist_ids = {a.pk for a in track.artists.all()}
            if artist_ids.intersection(followed_ids):
                score += 40
            if track.genre in genres:
                score += 12 * genres[track.genre]
            score += collab_counts.get(track.pk, 0) * 3
            score += min(track.streams, 50000) / 5000
            scored.append((score, track))

        scored.sort(key=lambda item: item[0], reverse=True)
        top = [track for score, track in scored if score > 0][:limit]
        if len(top) < limit:
            filler = (
                qs.exclude(pk__in=[t.pk for t in top])
                .order_by("-streams", "-created_at")[: limit - len(top)]
            )
            top.extend(list(filler))
        return top
