"use client";

import Link from "next/link";
import { useState } from "react";
import { ListMusic } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/stores/appStore";
import { getPlaylistLimit } from "@/lib/subscription";

export default function PlaylistsPage() {
  const user = useAppStore((s) => s.getCurrentUser());
  const playlists = useAppStore((s) => s.playlists);
  const createPlaylist = useAppStore((s) => s.createPlaylist);
  const renamePlaylist = useAppStore((s) => s.renamePlaylist);
  const deletePlaylist = useAppStore((s) => s.deletePlaylist);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);

  if (!user) return null;

  const mine = playlists.filter((p) => p.ownerId === user.id);
  const limit = getPlaylistLimit(user.subscriptionTier);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">پلی‌لیست‌ها</h1>
          <p className="text-sm text-[var(--muted)]">
            {mine.length} از {Number.isFinite(limit) ? limit : "∞"} پلی‌لیست
          </p>
        </div>
        <Button
          onClick={() => {
            setName("");
            setError("");
            setRenameId(null);
            setOpen(true);
          }}
        >
          ایجاد پلی‌لیست
        </Button>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={<ListMusic size={32} />}
          title="هنوز پلی‌لیستی ندارید"
          description="اولین لیست پخش خود را بسازید و آهنگ اضافه کنید."
          actionLabel="ایجاد اولین پلی‌لیست"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((pl) => (
            <div key={pl.id} className="rounded-2xl bg-[var(--surface)] p-4">
              <Link href={`/playlists/${pl.id}`} className="block">
                <h3 className="text-lg font-semibold hover:underline">{pl.name}</h3>
                <p className="text-sm text-[var(--muted)]">{pl.trackIds.length} آهنگ</p>
              </Link>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRenameId(pl.id);
                    setName(pl.name);
                    setOpen(true);
                  }}
                >
                  تغییر نام
                </Button>
                <Button variant="danger" onClick={() => deletePlaylist(pl.id)}>
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={renameId ? "تغییر نام پلی‌لیست" : "ایجاد پلی‌لیست"}
      >
        <div className="space-y-4">
          <Input label="نام" value={name} onChange={(e) => setName(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            onClick={async () => {
              if (!name.trim()) {
                setError("نام را وارد کنید");
                return;
              }
              if (renameId) {
                await renamePlaylist(renameId, name.trim());
                setOpen(false);
                return;
              }
              const res = await createPlaylist(name.trim());
              if (!res.ok) {
                setError(res.error || "خطا");
                return;
              }
              setOpen(false);
            }}
          >
            ذخیره
          </Button>
        </div>
      </Modal>
    </div>
  );
}
