"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { AlbumCard, TrackCard } from "@/components/cards/MediaCards";
import { useAppStore } from "@/stores/appStore";
import { canSeeEarlyAccess } from "@/lib/subscription";

export default function HomePage() {
  const user = useAppStore((s) => s.getCurrentUser());
  const tracks = useAppStore((s) => s.tracks);
  const albums = useAppStore((s) => s.albums);
  const playlists = useAppStore((s) => s.playlists);
  const recentPlaylistIds = useAppStore((s) => s.recentPlaylistIds);
  const recommendations = useAppStore((s) => s.recommendations);

  if (!user) return null;

  const recentPlaylists = recentPlaylistIds
    .map((id) => playlists.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 6);

  const latestAlbums = [...albums].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
  const topTracks = [...tracks]
    .filter((t) => !t.earlyAccess || canSeeEarlyAccess(user.subscriptionTier))
    .sort((a, b) => b.streams - a.streams);
  const earlyTracks = tracks.filter((t) => t.earlyAccess);

  return (
    <div className="space-y-10">
      <header className="flex items-center gap-4">
        <Avatar src={user.avatar} name={user.displayName} size={64} />
        <div>
          <p className="text-sm text-[var(--muted)]">خوش آمدید</p>
          <h1 className="font-display text-3xl font-bold">{user.displayName}</h1>
          {user.role === "artist" && user.artistProfile?.status === "pending" && (
            <p className="mt-1 text-sm text-amber-400">حساب هنرمندی شما در انتظار تأیید است.</p>
          )}
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">آخرین پلی‌لیست‌های شنیده‌شده</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentPlaylists.map((pl) => (
            <Link
              key={pl!.id}
              href={`/playlists/${pl!.id}`}
              className="rounded-2xl bg-[var(--surface)] px-4 py-5 transition hover:bg-[var(--surface-2)]"
            >
              <p className="font-medium">{pl!.name}</p>
              <p className="text-sm text-[var(--muted)]">{pl!.trackIds.length} آهنگ</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">آخرین آلبوم‌های منتشرشده</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {latestAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      <section>
          <h2 className="mb-4 text-xl font-semibold">آهنگ‌های پرشنونده</h2>
          <div className="space-y-2">
            {topTracks.slice(0, 5).map((track) => (
              <TrackCard key={track.id} track={track} queue={topTracks} />
            ))}
          </div>
        </section>

        {recommendations.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">پیشنهاد برای شما</h2>
            <div className="space-y-2">
              {recommendations.map((track) => (
                <TrackCard key={track.id} track={track} queue={recommendations} />
              ))}
            </div>
          </section>
        )}

      {canSeeEarlyAccess(user.subscriptionTier) && earlyTracks.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[var(--accent)]">دسترسی زودهنگام</h2>
          <div className="space-y-2">
            {earlyTracks.map((track) => (
              <TrackCard key={track.id} track={track} queue={earlyTracks} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
