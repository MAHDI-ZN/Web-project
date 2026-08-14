"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { useAppStore } from "@/stores/appStore";
import { formatNumber } from "@/lib/utils";

export default function AccountingPage() {
  const user = useAppStore((s) => s.getCurrentUser());
  const payouts = useAppStore((s) => s.payouts);
  const settlePayout = useAppStore((s) => s.settlePayout);
  const loadPayouts = useAppStore((s) => s.loadPayouts);

  useEffect(() => {
    void loadPayouts();
  }, [loadPayouts]);

  if (!user) return null;
  if (user.role !== "admin") {
    return <p className="text-[var(--muted)]">فقط مدیر سامانه به حسابرسی دسترسی دارد.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">حسابرسی هنرمندان</h1>
      <Table
        headers={[
          "نام هنرمند",
          "شناسه",
          "شنونده یکتا",
          "استریم ماه",
          "پاداش",
          "وضعیت",
          "عملیات",
        ]}
      >
        {payouts.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-3">{p.artistName || "-"}</td>
            <td className="px-4 py-3">{p.artistId}</td>
            <td className="px-4 py-3">{formatNumber(p.uniqueListeners)}</td>
            <td className="px-4 py-3">{formatNumber(p.streams)}</td>
            <td className="px-4 py-3">{formatNumber(p.amount)} تومان</td>
            <td className="px-4 py-3">
              {p.paymentStatus === "pending" ? "در انتظار پرداخت" : "تسویه شده"}
            </td>
            <td className="px-4 py-3">
              {p.paymentStatus === "pending" && (
                <Button onClick={() => void settlePayout(p.id)}>تأیید تسویه حساب</Button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
