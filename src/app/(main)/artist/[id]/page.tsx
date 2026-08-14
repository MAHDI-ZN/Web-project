"use client";

import { useParams } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { AlbumCard, TrackCard } from "@/components/cards/MediaCards";
import { useAppStore } from "@/stores/appStore";
import { canSeeStats } from "@/lib/subscription";
import { formatNumber } from "@/lib/utils";

export default function ArtistPage() {
  const params = useParams<{ id: string }>();
  const users = useAppStore((s) => s.users);
  const tracks = useAppStore((s) => s.tracks);
  const albums = useAppStore((s) => s.albums);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const followUser = useAppStore((s) => s.followUser);
  const unfollowUser = useAppStore((s) => s.unfollowUser);

  const artist = users.find((u) => u.id === params.id);
  if (!artist || !currentUser) {
    return <p className="text-[var(--muted)]">هنرمند یافت نشد.</p>;
  }

  const artistTracks = tracks.filter((t) => t.artistIds.includes(artist.id));
  const artistAlbums = albums.filter((a) => a.artistIds.includes(artist.id));
  const following = currentUser.following.includes(artist.id);
  const showStats = canSeeStats(currentUser.subscriptionTier);
  const totalStreams = artistTracks.reduce((s, t) => s + t.streams, 0);
  const totalListeners = artistTracks.reduce((s, t) => s + t.listeners, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl bg-[var(--surface)] p-6 sm:flex-row sm:items-center">
        <Avatar src={artist.avatar} name={artist.displayName} size={100} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">
              {artist.artistProfile?.stageName || artist.displayName}
            </h1>
            {artist.artistProfile?.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2 py-1 text-xs text-[var(--accent)]">
                <BadgeCheck size={14} /> هنرمند تأییدشده
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            {artist.artistProfile?.bio || "بیوگرافی ثبت نشده است."}
          </p>
          {showStats && (
            <p className="mt-2 text-sm">
              {formatNumber(totalListeners)} شنونده · {formatNumber(totalStreams)} استریم
            </p>
          )}
        </div>
        {currentUser.id !== artist.id && (
          <Button
            variant={following ? "secondary" : "primary"}
            onClick={() => (following ? unfollowUser(artist.id) : followUser(artist.id))}
          >
            {following ? "لغو دنبال" : "دنبال کردن"}
          </Button>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">آلبوم‌ها</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {artistAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">آثار</h2>
        <div className="space-y-2">
          {artistTracks.map((track) => (
            <TrackCard key={track.id} track={track} queue={artistTracks} />
          ))}
        </div>
      </section>
    </div>
  );
}
