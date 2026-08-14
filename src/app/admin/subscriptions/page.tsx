"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/stores/appStore";
import { formatNumber } from "@/lib/utils";

const COLORS = ["#6b7280", "#94a3b8", "#3dd68c"];

export default function SubscriptionsAdminPage() {
  const user = useAppStore((s) => s.getCurrentUser());
  const prices = useAppStore((s) => s.prices);
  const adminReport = useAppStore((s) => s.adminReport);
  const updatePrices = useAppStore((s) => s.updatePrices);
  const loadAdminReport = useAppStore((s) => s.loadAdminReport);
  const [silver, setSilver] = useState(prices.silver);
  const [gold, setGold] = useState(prices.gold);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void loadAdminReport();
  }, [loadAdminReport]);

  useEffect(() => {
    setSilver(prices.silver);
    setGold(prices.gold);
  }, [prices]);

  if (!user) return null;
  if (user.role !== "admin") {
    return <p className="text-[var(--muted)]">فقط مدیر سامانه به این بخش دسترسی دارد.</p>;
  }

  const dist = adminReport?.subscriptionDistribution ?? { basic: 0, silver: 0, gold: 0 };
  const chartData = [
    { name: "پایه", value: dist.basic },
    { name: "نقره‌ای", value: dist.silver },
    { name: "طلایی", value: dist.gold },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">مدیریت اشتراک‌ها</h1>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-[var(--surface)] p-5">
          <p className="text-sm text-[var(--muted)]">درآمد ماه جاری</p>
          <p className="mt-2 text-2xl font-bold text-[var(--accent)]">
            {formatNumber(adminReport?.monthlyRevenue ?? 0)} تومان
          </p>
        </div>
        <div className="rounded-3xl bg-[var(--surface)] p-5">
          <p className="text-sm text-[var(--muted)]">کاربران نقره‌ای</p>
          <p className="mt-2 text-2xl font-bold">{formatNumber(adminReport?.silverUserCount ?? 0)}</p>
        </div>
        <div className="rounded-3xl bg-[var(--surface)] p-5">
          <p className="text-sm text-[var(--muted)]">کاربران طلایی</p>
          <p className="mt-2 text-2xl font-bold">{formatNumber(adminReport?.goldUserCount ?? 0)}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-[var(--surface)] p-5">
        <h2 className="mb-4 font-semibold">توزیع اشتراک‌ها</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-[var(--surface)] p-5">
        <h2 className="font-semibold">بروزرسانی قیمت‌ها</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="قیمت اشتراک نقره‌ای (تومان / ماه)"
            type="number"
            value={silver}
            onChange={(e) => setSilver(Number(e.target.value))}
          />
          <Input
            label="قیمت اشتراک طلایی (تومان / ماه)"
            type="number"
            value={gold}
            onChange={(e) => setGold(Number(e.target.value))}
          />
        </div>
        <Button
          onClick={async () => {
            await updatePrices({ silver, gold });
            await loadAdminReport();
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
        >
          بروزرسانی قیمت‌ها
        </Button>
        {saved && <p className="text-sm text-[var(--accent)]">قیمت‌ها به‌روز شد.</p>}
      </section>
    </div>
  );
}
