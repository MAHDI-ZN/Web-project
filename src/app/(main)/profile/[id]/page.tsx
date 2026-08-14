"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/stores/appStore";
import { TIER_LABELS, canUploadAvatar } from "@/lib/subscription";
import { formatNumber } from "@/lib/utils";

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.getCurrentUser());
  const followUser = useAppStore((s) => s.followUser);
  const unfollowUser = useAppStore((s) => s.unfollowUser);
  const updateUser = useAppStore((s) => s.updateUser);

  const user = users.find((u) => u.id === params.id);
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  if (!user || !currentUser) {
    return <p className="text-[var(--muted)]">کاربر یافت نشد.</p>;
  }

  const isSelf = currentUser.id === user.id;
  const following = currentUser.following.includes(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-[var(--surface)] p-6 sm:flex-row sm:items-center">
        <Avatar src={user.avatar} name={user.displayName} size={96} />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold">{user.displayName}</h1>
          <p className="text-[var(--muted)]">@{user.username}</p>
          <p className="mt-2 text-sm">
            اشتراک {TIER_LABELS[user.subscriptionTier]} · {formatNumber(user.followers.length)} دنبال‌کننده ·{" "}
            {formatNumber(user.following.length)} دنبال‌شونده
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            استریم امروز: {formatNumber(user.dailyStreamCount)}
          </p>
        </div>
        <div className="flex gap-2">
          {!isSelf && (
            <Button
              variant={following ? "secondary" : "primary"}
              onClick={() => (following ? void unfollowUser(user.id) : void followUser(user.id))}
            >
              {following ? "لغو دنبال" : "دنبال کردن"}
            </Button>
          )}
          {isSelf && (
            <Button
              variant="secondary"
              onClick={() => {
                setDisplayName(user.displayName);
                setEditOpen(true);
              }}
            >
              ویرایش
            </Button>
          )}
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="ویرایش نمایه">
        <div className="space-y-4">
          <Input
            label="نام نمایشی"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <label className="block text-sm">
            <span className="mb-1.5 block text-[var(--muted)]">عکس پروفایل</span>
            <input
              type="file"
              accept="image/*"
              disabled={!canUploadAvatar(currentUser.subscriptionTier)}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!canUploadAvatar(currentUser.subscriptionTier)) {
                  setError("اشتراک پایه امکان آپلود عکس ندارد.");
                  return;
                }
                try {
                  await updateUser(user.id, {}, file);
                } catch {
                  setError("آپلود عکس ناموفق بود.");
                }
              }}
            />
            {!canUploadAvatar(currentUser.subscriptionTier) && (
              <span className="mt-1 block text-xs text-amber-400">
                برای آپلود عکس، اشتراک نقره‌ای یا طلایی نیاز است.
              </span>
            )}
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            onClick={async () => {
              await updateUser(user.id, { displayName: displayName.trim() || user.displayName });
              setEditOpen(false);
            }}
          >
            ذخیره
          </Button>
        </div>
      </Modal>
    </div>
  );
}
