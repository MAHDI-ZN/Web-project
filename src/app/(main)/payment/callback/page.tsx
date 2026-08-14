"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/stores/appStore";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const verifyPayment = useAppStore((s) => s.verifyPayment);
  const [message, setMessage] = useState("در حال تأیید تراکنش...");

  useEffect(() => {
    const authority = params.get("Authority") || params.get("authority") || "";
    const status = params.get("Status") || params.get("status") || "OK";
    if (!authority) {
      setMessage("شناسه تراکنش یافت نشد.");
      return;
    }
    void verifyPayment(authority, status).then((res) => {
      if (res.ok) {
        setMessage("پرداخت موفق بود. اشتراک شما به‌روز شد.");
        setTimeout(() => router.replace("/settings"), 1200);
      } else {
        setMessage(res.error || "پرداخت ناموفق بود.");
      }
    });
  }, [params, verifyPayment, router]);

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-3xl bg-[var(--surface)] p-6">
      <h1 className="font-display text-2xl font-bold">نتیجه پرداخت</h1>
      <p className="text-sm text-[var(--muted)]">{message}</p>
      <Button onClick={() => router.push("/settings")}>بازگشت به تنظیمات</Button>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">در حال بارگذاری...</p>}>
      <CallbackInner />
    </Suspense>
  );
}
