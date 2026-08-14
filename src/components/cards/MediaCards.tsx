"use client";

import Link from "next/link";
import Image from "next/image";
import { ListPlus, Play, Download } from "lucide-react";
import { useState } from "react";
import type { Album, Track } from "@/lib/types";
import { useAppStore } from "@/stores/appStore";
import { usePlayerStore } from "@/stores/playerStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { canSeeStats, canDownload } from "@/lib/subscription";
import { formatNumber } from "@/lib/utils";
import { getApiUrl, getToken } from "@/lib/api/client";

export function AlbumCard({ album }: { album: Album }) {
  const users = useAppStore((s) => s.users);
  const artists = album.artistIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  return (
    <div className="group overflow-hidden rounded-2xl bg-[var(--surface)] transition hover:bg-[var(--surface-2)]">
      <Link href={`/album/${album.id}`} className="block">
        <Image
          src={album.cover}
          alt={album.title}
          width={320}
          height={320}
          unoptimized
          className="aspect-square w-full object-cover"
        />
      </Link>
      <div className="space-y-1 p-3">
        <Link href={`/album/${album.id}`} className="block font-medium hover:underline">
          {album.title}
        </Link>
        <div className="text-sm text-[var(--muted)]">
          {artists.map((a, i) => (
            <span key={a!.id}>
              {i > 0 && "، "}
              <Link href={`/artist/${a!.id}`} className="hover:underline">
                {a!.artistProfile?.stageName || a!.displayName}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrackCard({
  track,
  queue,
}: {
  track: Track;
  queue?: Track[];
}) {
  const users = useAppStore((s) => s.users);
  const albums = useAppStore((s) => s.albums);
  const playlists = useAppStore((s) => s.playlists);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const addTrackToPlaylist = useAppStore((s) => s.addTrackToPlaylist);
  const removeTrackFromPlaylist = useAppStore((s) => s.removeTrackFromPlaylist);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const [open, setOpen] = useState(false);

  const artists = track.artistIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);
  const album = track.albumId ? albums.find((a) => a.id === track.albumId) : undefined;
  const myPlaylists = playlists.filter((p) => p.ownerId === currentUser?.id);
  const showStats = currentUser && canSeeStats(currentUser.subscriptionTier);
  const showDownload = currentUser && canDownload(currentUser.subscriptionTier);

  return (
    <div className="group flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-3 transition hover:bg-[var(--surface-2)]">
      <button
        className="relative shrink-0"
        onClick={() => void playTrack(track, queue)}
        aria-label="پخش"
      >
        <Image
          src={track.cover}
          alt={track.title}
          width={64}
          height={64}
          unoptimized
          className="h-16 w-16 rounded-xl object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition group-hover:opacity-100">
          <Play size={20} className="text-white" fill="white" />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <button
          className="block truncate text-right font-medium hover:underline"
          onClick={() => void playTrack(track, queue)}
        >
          {track.title}
        </button>
        <div className="truncate text-sm text-[var(--muted)]">
          {artists.map((a, i) => (
            <span key={a!.id}>
              {i > 0 && "، "}
              <Link href={`/artist/${a!.id}`} className="hover:underline">
                {a!.artistProfile?.stageName || a!.displayName}
              </Link>
            </span>
          ))}
          {album && (
            <>
              {" · "}
              <Link href={`/album/${album.id}`} className="hover:underline">
                {album.title}
              </Link>
            </>
          )}
        </div>
        {showStats && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            {formatNumber(track.streams)} استریم · {formatNumber(track.listeners)} شنونده
          </p>
        )}
      </div>

      {showDownload && (
        <Button
          variant="ghost"
          className="!p-2"
          aria-label="دانلود"
          onClick={async () => {
            const token = getToken();
            const res = await fetch(`${getApiUrl()}/api/tracks/${track.id}/download/`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) return;
            const type = res.headers.get("content-type") || "";
            if (type.includes("json")) {
              const data = (await res.json()) as { url?: string };
              if (data.url) window.open(data.url, "_blank");
              return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${track.title}.mp3`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download size={18} />
        </Button>
      )}

      <Button variant="ghost" className="!p-2" onClick={() => setOpen(true)} aria-label="افزودن به پلی‌لیست">
        <ListPlus size={18} />
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="مدیریت پلی‌لیست">
        {myPlaylists.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">ابتدا یک پلی‌لیست بسازید.</p>
        ) : (
          <ul className="space-y-2">
            {myPlaylists.map((pl) => {
              const inPl = pl.trackIds.includes(track.id);
              return (
                <li key={pl.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2">
                  <span>{pl.name}</span>
                  <Button
                    variant={inPl ? "danger" : "secondary"}
                    onClick={() => {
                      if (inPl) removeTrackFromPlaylist(pl.id, track.id);
                      else addTrackToPlaylist(pl.id, track.id);
                    }}
                  >
                    {inPl ? "حذف" : "افزودن"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
}
