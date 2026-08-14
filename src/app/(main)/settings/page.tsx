"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/stores/appStore";
import { TIER_LABELS } from "@/lib/subscription";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.getCurrentUser());
  const updateSettings = useAppStore((s) => s.updateSettings);
  const deleteAccount = useAppStore((s) => s.deleteAccount);
  const createTicket = useAppStore((s) => s.createTicket);
  const prices = useAppStore((s) => s.prices);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-bold">تنظیمات برنامه</h1>

      <section className="space-y-4 rounded-3xl bg-[var(--surface)] p-5">
        <h2 className="font-semibold">اعلان‌ها و صدا</h2>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>فعال بودن اعلان‌ها</span>
          <input
            type="checkbox"
            checked={user.settings.notificationsEnabled}
            onChange={(e) => void updateSettings({ notificationsEnabled: e.target.checked })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--muted)]">صدای سامانه</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={user.settings.volume}
            onChange={(e) => void updateSettings({ volume: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-2 block text-[var(--muted)]">زبان</span>
          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            value={user.settings.language}
            onChange={(e) => void updateSettings({ language: e.target.value as "fa" | "en" })}
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
        </label>
      </section>

      <section className="space-y-3 rounded-3xl bg-[var(--surface)] p-5">
        <h2 className="font-semibold">اشتراک</h2>
        <p className="text-sm text-[var(--muted)]">
          نوع فعلی: <span className="text-[var(--foreground)]">{TIER_LABELS[user.subscriptionTier]}</span>
          {user.subscriptionExpiresAt && ` · انقضا: ${user.subscriptionExpiresAt}`}
        </p>
        <p className="text-xs text-[var(--muted)]">
          قیمت‌ها: نقره‌ای {prices.silver.toLocaleString("fa-IR")} تومان · طلایی{" "}
          {prices.gold.toLocaleString("fa-IR")} تومان
        </p>
        <Link href="/payment">
          <Button>ارتقا یا تغییر اشتراک</Button>
        </Link>
      </section>

      {user.role === "listener" || user.role === "artist" ? (
        <section className="space-y-3 rounded-3xl bg-[var(--surface)] p-5">
          <h2 className="font-semibold">تیکت پشتیبانی</h2>
          <Input label="موضوع" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea
            className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            placeholder="متن پیام"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {ticketMsg && <p className="text-sm text-[var(--accent)]">{ticketMsg}</p>}
          <Button
            onClick={async () => {
              const res = await createTicket(subject.trim(), body.trim());
              if (res.ok) {
                setSubject("");
                setBody("");
                setTicketMsg("تیکت ثبت شد.");
              } else {
                setTicketMsg(res.error || "خطا");
              }
            }}
          >
            ارسال تیکت
          </Button>
        </section>
      ) : null}

      <section className="rounded-3xl border border-red-500/30 bg-[var(--surface)] p-5">
        <h2 className="font-semibold text-red-400">حذف حساب</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">این عمل حساب شما را از سرور حذف می‌کند.</p>
        <Button
          variant="danger"
          className="mt-3"
          onClick={async () => {
            if (confirm("آیا از حذف حساب مطمئن هستید؟")) {
              await deleteAccount();
              router.replace("/login");
            }
          }}
        >
          حذف حساب کاربری
        </Button>
      </section>
    </div>
  );
}
