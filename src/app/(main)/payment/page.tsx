"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/stores/appStore";
import { TIER_LABELS } from "@/lib/subscription";
import type { SubscriptionTier } from "@/lib/types";

export default function PaymentPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.getCurrentUser());
  const prices = useAppStore((s) => s.prices);
  const initiatePayment = useAppStore((s) => s.initiatePayment);
  const [tier, setTier] = useState<Exclude<SubscriptionTier, "basic">>("silver");
  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const unit = tier === "silver" ? prices.silver : prices.gold;
  const total = unit * months;

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-3xl bg-[var(--surface)] p-6">
      <h1 className="font-display text-3xl font-bold">پرداخت اشتراک</h1>
      <p className="text-sm text-[var(--muted)]">
        اتصال به درگاه پرداخت (حالت آزمایشی/زرین‌پال). اشتراک فعلی:{" "}
        {TIER_LABELS[user.subscriptionTier]}
      </p>

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">نوع اشتراک</span>
          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            value={tier}
            onChange={(e) => setTier(e.target.value as "silver" | "gold")}
          >
            <option value="silver">نقره‌ای — {prices.silver.toLocaleString("fa-IR")} تومان / ماه</option>
            <option value="gold">طلایی — {prices.gold.toLocaleString("fa-IR")} تومان / ماه</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">بازه پرداخت</span>
          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) as 1 | 3 | 6 | 12)}
          >
            {[1, 3, 6, 12].map((m) => (
              <option key={m} value={m}>
                {m} ماهه
              </option>
            ))}
          </select>
        </label>
        <p className="text-lg font-semibold">
          مبلغ: {total.toLocaleString("fa-IR")} تومان
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        className="w-full"
        disabled={loading}
        onClick={async () => {
          setError("");
          setLoading(true);
          const res = await initiatePayment(tier, months);
          setLoading(false);
          if (!res.ok || !res.redirectUrl) {
            setError(res.error || "خطا در اتصال به درگاه");
            return;
          }
          window.location.href = res.redirectUrl;
        }}
      >
        {loading ? "در حال اتصال..." : "پرداخت"}
      </Button>
      <Button variant="secondary" className="w-full" onClick={() => router.push("/settings")}>
        انصراف
      </Button>
    </div>
  );
}
