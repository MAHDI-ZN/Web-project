"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { TrackCard } from "@/components/cards/MediaCards";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/Button";

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const playlists = useAppStore((s) => s.playlists);
  const tracks = useAppStore((s) => s.tracks);
  const removeTrackFromPlaylist = useAppStore((s) => s.removeTrackFromPlaylist);
  const touchRecentPlaylist = useAppStore((s) => s.touchRecentPlaylist);

  const playlist = playlists.find((p) => p.id === params.id);

  useEffect(() => {
    if (playlist) touchRecentPlaylist(playlist.id);
  }, [playlist, touchRecentPlaylist]);

  if (!playlist) return <p className="text-[var(--muted)]">پلی‌لیست یافت نشد.</p>;

  const list = playlist.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{playlist.name}</h1>
        <p className="text-sm text-[var(--muted)]">{list.length} آهنگ</p>
        <Link href="/browse" className="mt-3 inline-block">
          <Button variant="secondary">افزودن آهنگ از آرشیو</Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="این پلی‌لیست خالی است"
          description="از صفحه آلبوم‌ها و تک‌آهنگ‌ها آهنگ اضافه کنید."
          actionLabel="رفتن به آرشیو"
          onAction={() => {
            window.location.href = "/browse";
          }}
        />
      ) : (
        <div className="space-y-2">
          {list.map((track) => (
            <div key={track!.id} className="space-y-1">
              <TrackCard track={track!} queue={list as typeof tracks} />
              <div className="px-3">
                <Button
                  variant="ghost"
                  className="text-xs text-red-400"
                  onClick={() => removeTrackFromPlaylist(playlist.id, track!.id)}
                >
                  حذف از این پلی‌لیست
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
