"use client";

import Link from "next/link";
import { BellOff, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const user = useAppStore((s) => s.getCurrentUser());
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);
  const deleteNotification = useAppStore((s) => s.deleteNotification);

  if (!user) return null;

  const mine = notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">اعلان‌ها</h1>
        {mine.length > 0 && (
          <Button variant="secondary" onClick={markAllNotificationsRead}>
            <CheckCheck size={16} /> خواندن همه
          </Button>
        )}
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={<BellOff size={32} />}
          title="اعلانی وجود ندارد"
          description="وقتی خبر جدیدی باشد اینجا نمایش داده می‌شود."
        />
      ) : (
        <ul className="space-y-2">
          {mine.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-2xl border p-4 transition",
                n.read
                  ? "border-[var(--border)] bg-[var(--surface)]"
                  : "border-[var(--accent)]/30 bg-[var(--accent)]/10"
              )}
            >
              <div className="flex items-start gap-3">
                {!n.read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{n.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{n.body}</p>
                  {n.href && (
                    <Link href={n.href} className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline">
                      مشاهده
                    </Link>
                  )}
                </div>
                <div className="flex gap-1">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      className="!p-2"
                      onClick={() => markNotificationRead(n.id)}
                      title="علامت‌گذاری به‌عنوان خوانده‌شده"
                    >
                      <CheckCheck size={16} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="!p-2"
                    onClick={() => deleteNotification(n.id)}
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
