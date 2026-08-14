"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { TrackCard } from "@/components/cards/MediaCards";
import { useAppStore } from "@/stores/appStore";

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const albums = useAppStore((s) => s.albums);
  const tracks = useAppStore((s) => s.tracks);
  const users = useAppStore((s) => s.users);

  const album = albums.find((a) => a.id === params.id);
  if (!album) return <p className="text-[var(--muted)]">آلبوم یافت نشد.</p>;

  const list = album.trackIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean);
  const artists = album.artistIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Image
          src={album.cover}
          alt={album.title}
          width={220}
          height={220}
          unoptimized
          className="h-52 w-52 rounded-3xl object-cover shadow-xl"
        />
        <div>
          <p className="text-sm text-[var(--muted)]">آلبوم · {album.year}</p>
          <h1 className="font-display text-4xl font-bold">{album.title}</h1>
          <p className="mt-2 text-[var(--muted)]">
            {artists.map((a, i) => (
              <span key={a!.id}>
                {i > 0 && "، "}
                <Link href={`/artist/${a!.id}`} className="hover:underline">
                  {a!.artistProfile?.stageName || a!.displayName}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {list.map((track) => (
          <TrackCard key={track!.id} track={track!} queue={list as typeof tracks} />
        ))}
      </div>
    </div>
  );
}
