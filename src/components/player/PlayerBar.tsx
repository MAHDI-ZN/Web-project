"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ListMusic,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/playerStore";
import { useAppStore } from "@/stores/appStore";
import { formatTime, formatNumber, cn } from "@/lib/utils";
import { canSeeStats } from "@/lib/subscription";
import type { RepeatMode } from "@/lib/types";
import { Button } from "../ui/Button";

function cycleRepeat(mode: RepeatMode): RepeatMode {
  if (mode === "off") return "all";
  if (mode === "all") return "one";
  return "off";
}

export function PlayerBar() {
  const initEngine = usePlayerStore((s) => s.initEngine);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const repeat = usePlayerStore((s) => s.repeat);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const expanded = usePlayerStore((s) => s.expanded);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setRepeat = usePlayerStore((s) => s.setRepeat);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const playAt = usePlayerStore((s) => s.playAt);

  const users = useAppStore((s) => s.users);
  const albums = useAppStore((s) => s.albums);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  const track = currentIndex >= 0 ? queue[currentIndex] : null;
  if (!track) return null;

  const artists = track.artistIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);
  const album = track.albumId ? albums.find((a) => a.id === track.albumId) : undefined;
  const showStats = currentUser && canSeeStats(currentUser.subscriptionTier);

  const controls = (
    <div className="flex items-center justify-center gap-2">
      <button
        className={cn("rounded-lg p-2 hover:bg-white/10", shuffle && "text-[var(--accent)]")}
        onClick={toggleShuffle}
        aria-label="شافل"
      >
        <Shuffle size={18} />
      </button>
      <button className="rounded-lg p-2 hover:bg-white/10" onClick={() => void prev()} aria-label="قبلی">
        <SkipBack size={20} />
      </button>
      <button
        className="rounded-full bg-[var(--accent)] p-3 text-[var(--accent-fg)]"
        onClick={() => void togglePlay()}
        aria-label={isPlaying ? "توقف" : "پخش"}
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </button>
      <button className="rounded-lg p-2 hover:bg-white/10" onClick={() => void next()} aria-label="بعدی">
        <SkipForward size={20} />
      </button>
      <button
        className={cn("rounded-lg p-2 hover:bg-white/10", repeat !== "off" && "text-[var(--accent)]")}
        onClick={() => setRepeat(cycleRepeat(repeat))}
        aria-label="تکرار"
      >
        {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
      </button>
    </div>
  );

  const progress = (
    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
      <span className="w-10 tabular-nums">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => seek(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-[var(--accent)]"
      />
      <span className="w-10 tabular-nums">{formatTime(duration)}</span>
    </div>
  );

  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--background)] p-6">
        <div className="mb-4 flex justify-between">
          <Button variant="ghost" onClick={() => setExpanded(false)}>
            <Minimize2 size={18} /> بستن
          </Button>
          <Button variant="ghost" onClick={() => setShowQueue((v) => !v)}>
            <ListMusic size={18} /> صف پخش
          </Button>
        </div>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 overflow-auto md:flex-row md:items-start">
          <Image
            src={track.cover}
            alt={track.title}
            width={420}
            height={420}
            unoptimized
            className="aspect-square w-full max-w-sm rounded-3xl object-cover shadow-2xl"
          />
          <div className="w-full flex-1 space-y-4">
            <div>
              <h2 className="font-display text-3xl font-bold">{track.title}</h2>
              <p className="mt-2 text-[var(--muted)]">
                {artists.map((a, i) => (
                  <span key={a!.id}>
                    {i > 0 && "، "}
                    <Link href={`/artist/${a!.id}`} className="hover:underline" onClick={() => setExpanded(false)}>
                      {a!.artistProfile?.stageName || a!.displayName}
                    </Link>
                  </span>
                ))}
                {album && (
                  <>
                    {" · "}
                    <Link href={`/album/${album.id}`} className="hover:underline" onClick={() => setExpanded(false)}>
                      {album.title}
                    </Link>
                  </>
                )}
              </p>
              {showStats && (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {formatNumber(track.streams)} استریم · {formatNumber(track.listeners)} شنونده
                </p>
              )}
            </div>
            {progress}
            {controls}
            <div className="flex items-center gap-3">
              <Volume2 size={16} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-40 accent-[var(--accent)]"
              />
            </div>
            {track.lyrics && (
              <div className="rounded-2xl bg-[var(--surface)] p-4">
                <h3 className="mb-2 font-medium">متن آهنگ</h3>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--muted)]">
                  {track.lyrics}
                </pre>
              </div>
            )}
            {showQueue && (
              <div className="rounded-2xl bg-[var(--surface)] p-4">
                <h3 className="mb-3 font-medium">صف پخش</h3>
                <ul className="max-h-64 space-y-2 overflow-auto">
                  {queue.map((t, i) => (
                    <li key={`${t.id}-${i}`} className="flex items-center gap-2">
                      <button
                        className={cn(
                          "flex-1 truncate rounded-lg px-2 py-1.5 text-right text-sm hover:bg-[var(--surface-2)]",
                          i === currentIndex && "text-[var(--accent)]"
                        )}
                        onClick={() => void playAt(i)}
                      >
                        {t.title}
                      </button>
                      <button className="p-1 text-[var(--muted)]" onClick={() => removeFromQueue(i)}>
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setExpanded(true)}>
              <Image
                src={track.cover}
                alt={track.title}
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-lg object-cover"
              />
            </button>
            <div className="min-w-0">
              <p className="truncate font-medium">{track.title}</p>
              <p className="truncate text-xs text-[var(--muted)]">
                {artists.map((a) => a!.artistProfile?.stageName || a!.displayName).join("، ")}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {controls}
            {progress}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" className="!p-2" onClick={() => setShowQueue((v) => !v)}>
              <ListMusic size={18} />
            </Button>
            <Button variant="ghost" className="!p-2" onClick={() => setExpanded(true)}>
              <Maximize2 size={18} />
            </Button>
            <Volume2 size={16} className="text-[var(--muted)]" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-[var(--accent)]"
            />
          </div>
        </div>
        {showQueue && (
          <div className="mx-auto mt-3 max-w-7xl rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
            <h4 className="mb-2 text-sm font-medium">صف پخش</h4>
            <div className="flex max-h-40 flex-col gap-1 overflow-auto">
              {queue.map((t, i) => (
                <button
                  key={`${t.id}-q-${i}`}
                  className={cn(
                    "rounded-lg px-2 py-1 text-right text-sm hover:bg-[var(--surface-2)]",
                    i === currentIndex && "text-[var(--accent)]"
                  )}
                  onClick={() => void playAt(i)}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile mini player */}
      <div className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-3 shadow-lg backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setExpanded(true)}>
            <Image
              src={track.cover}
              alt={track.title}
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 rounded-lg object-cover"
            />
          </button>
          <button className="min-w-0 flex-1 text-right" onClick={() => setExpanded(true)}>
            <p className="truncate text-sm font-medium">{track.title}</p>
            <p className="truncate text-xs text-[var(--muted)]">
              {artists[0]?.artistProfile?.stageName || artists[0]?.displayName}
            </p>
          </button>
          <button
            className="rounded-full bg-[var(--accent)] p-2.5 text-[var(--accent-fg)]"
            onClick={() => void togglePlay()}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          className="mt-2 h-1 w-full accent-[var(--accent)]"
        />
      </div>
    </>
  );
}
