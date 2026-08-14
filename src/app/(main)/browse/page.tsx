"use client";

import { useMemo, useState } from "react";
import { AlbumCard, TrackCard } from "@/components/cards/MediaCards";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/stores/appStore";
import { canSeeEarlyAccess } from "@/lib/subscription";

type SortKey = "listeners" | "date";

export default function BrowsePage() {
  const user = useAppStore((s) => s.getCurrentUser());
  const tracks = useAppStore((s) => s.tracks);
  const albums = useAppStore((s) => s.albums);
  const users = useAppStore((s) => s.users);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("listeners");

  const filteredTracks = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = tracks.filter((t) => {
      if (t.earlyAccess && user && !canSeeEarlyAccess(user.subscriptionTier)) return false;
      if (!query) return true;
      const names = t.artistIds
        .map((id) => {
          const u = users.find((x) => x.id === id);
          return u?.artistProfile?.stageName || u?.displayName || "";
        })
        .join(" ")
        .toLowerCase();
      return t.title.toLowerCase().includes(query) || names.includes(query);
    });
    list = [...list].sort((a, b) =>
      sort === "listeners"
        ? b.listeners - a.listeners
        : +new Date(b.createdAt) - +new Date(a.createdAt)
    );
    return list;
  }, [tracks, q, sort, users, user]);

  const filteredAlbums = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = albums.filter((a) => {
      if (a.earlyAccess && user && !canSeeEarlyAccess(user.subscriptionTier)) return false;
      if (!query) return true;
      const names = a.artistIds
        .map((id) => {
          const u = users.find((x) => x.id === id);
          return u?.artistProfile?.stageName || u?.displayName || "";
        })
        .join(" ")
        .toLowerCase();
      return a.title.toLowerCase().includes(query) || names.includes(query);
    });
    list = [...list].sort((a, b) =>
      sort === "date"
        ? +new Date(b.createdAt) - +new Date(a.createdAt)
        : b.trackIds.length - a.trackIds.length
    );
    return list;
  }, [albums, q, sort, users, user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">آلبوم‌ها و تک‌آهنگ‌ها</h1>
        <p className="text-sm text-[var(--muted)]">جستجو و کشف موسیقی</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="جستجو بر اساس نام اثر یا هنرمند..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="listeners">مرتب‌سازی: تعداد شنونده</option>
          <option value="date">مرتب‌سازی: تاریخ انتشار</option>
        </select>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">آلبوم‌ها</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">تک‌آهنگ‌ها و ترک‌ها</h2>
        <div className="space-y-2">
          {filteredTracks.map((track) => (
            <TrackCard key={track.id} track={track} queue={filteredTracks} />
          ))}
        </div>
      </section>
    </div>
  );
}
