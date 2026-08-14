"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/stores/appStore";

const schema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const requestPasswordReset = useAppStore((s) => s.requestPasswordReset);
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
      <h1 className="text-2xl font-bold">بازیابی رمز عبور</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        ایمیل حساب خود را وارد کنید تا لینک بازیابی ارسال شود.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (data) => {
          const res = await requestPasswordReset(data.email);
          setMessage(res.message);
        })}
      >
        <Input label="ایمیل" type="email" {...register("email")} error={errors.email?.message} />
        {message && <p className="text-sm text-[var(--accent)]">{message}</p>}
        <Button type="submit" className="w-full">
          ارسال لینک
        </Button>
      </form>
      <Link href="/login" className="mt-4 inline-block text-sm text-[var(--muted)] hover:underline">
        بازگشت به ورود
      </Link>
    </div>
  );
}
