"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { homePathForRole, useAppStore } from "@/stores/appStore";

const schema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const currentUser = useAppStore((s) => s.currentUser);
  const login = useAppStore((s) => s.login);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!hydrated || !currentUser) return;
    router.replace(homePathForRole(currentUser.role));
  }, [hydrated, currentUser, router]);

  const onSubmit = async (data: Form) => {
    setError("");
    const res = await login(data.email, data.password);
    if (!res.ok || !res.user) {
      setError(res.error || "خطا در ورود");
      return;
    }
    router.push(homePathForRole(res.user.role));
  };

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
      <h1 className="font-display text-3xl font-bold text-[var(--accent)]">Melody</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">ورود به حساب کاربری</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="ایمیل" type="email" {...register("email")} error={errors.email?.message} />
        <Input
          label="رمز عبور"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          ورود
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link href="/forgot-password" className="text-[var(--accent)] hover:underline">
          فراموشی رمز عبور
        </Link>
        <Link href="/register" className="text-[var(--muted)] hover:text-[var(--foreground)]">
          حساب ندارید؟ ثبت‌نام
        </Link>
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
        <p className="mb-1 font-medium text-[var(--foreground)]">حساب‌های دمو (رمز: demo1234)</p>
        <ul className="space-y-1">
          <li>sara@demo.com — شنونده پایه</li>
          <li>ali@demo.com — شنونده نقره‌ای</li>
          <li>nima@demo.com — شنونده طلایی</li>
          <li>ava@demo.com — هنرمند تأییدشده</li>
          <li>kaveh@demo.com — هنرمند در انتظار</li>
          <li>support@demo.com — پشتیبان</li>
          <li>admin@demo.com — مدیر</li>
        </ul>
      </div>
    </div>
  );
}
