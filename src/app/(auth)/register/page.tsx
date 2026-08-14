"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/stores/appStore";

const listenerSchema = z
  .object({
    displayName: z.string().min(2, "نام نمایشی کوتاه است"),
    email: z.string().email("ایمیل معتبر نیست"),
    password: z.string().min(6, "حداقل ۶ کاراکتر"),
    confirm: z.string(),
    birthDate: z.string().min(1, "تاریخ تولد الزامی است"),
    gender: z.enum(["male", "female", "other", "prefer_not"]),
    privacy: z.boolean().refine((v) => v === true, {
      message: "پذیرش حریم خصوصی الزامی است",
    }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "تأیید رمز مطابقت ندارد",
    path: ["confirm"],
  });

const artistSchema = z.object({
  email: z.string().email("ایمیل معتبر نیست"),
  password: z.string().min(6, "حداقل ۶ کاراکتر"),
  stageName: z.string().min(2, "نام هنری الزامی است"),
  sampleWorks: z.string().min(3, "نمونه کارها را وارد کنید"),
});

type ListenerForm = z.infer<typeof listenerSchema>;
type ArtistForm = z.infer<typeof artistSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerListener = useAppStore((s) => s.registerListener);
  const registerArtist = useAppStore((s) => s.registerArtist);
  const [tab, setTab] = useState<"listener" | "artist">("listener");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [error, setError] = useState("");

  const listenerForm = useForm<ListenerForm>({
    resolver: zodResolver(listenerSchema),
    defaultValues: { gender: "prefer_not", privacy: false },
  });

  const artistForm = useForm<ArtistForm>({
    resolver: zodResolver(artistSchema),
  });

  const onListener = async (data: ListenerForm) => {
    setError("");
    const res = await registerListener(data);
    if (!res.ok) {
      setError(res.error || "خطا");
      return;
    }
    router.push("/home");
  };

  const onArtist = async (data: ArtistForm) => {
    setError("");
    const res = await registerArtist(data);
    if (!res.ok) {
      setError(res.error || "خطا");
      return;
    }
    router.push("/home");
  };

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
      <h1 className="font-display text-3xl font-bold text-[var(--accent)]">ثبت‌نام</h1>
      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant={tab === "listener" ? "primary" : "secondary"}
          onClick={() => setTab("listener")}
        >
          شنونده
        </Button>
        <Button
          type="button"
          variant={tab === "artist" ? "primary" : "secondary"}
          onClick={() => setTab("artist")}
        >
          هنرمند
        </Button>
      </div>

      {tab === "listener" ? (
        <form className="mt-6 space-y-3" onSubmit={listenerForm.handleSubmit(onListener)}>
          <Input label="نام نمایشی" {...listenerForm.register("displayName")} error={listenerForm.formState.errors.displayName?.message} />
          <Input label="ایمیل" type="email" {...listenerForm.register("email")} error={listenerForm.formState.errors.email?.message} />
          <Input label="رمز عبور" type="password" {...listenerForm.register("password")} error={listenerForm.formState.errors.password?.message} />
          <Input label="تأیید رمز عبور" type="password" {...listenerForm.register("confirm")} error={listenerForm.formState.errors.confirm?.message} />
          <Input label="تاریخ تولد" type="date" {...listenerForm.register("birthDate")} error={listenerForm.formState.errors.birthDate?.message} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[var(--muted)]">جنسیت</span>
            <select
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
              {...listenerForm.register("gender")}
            >
              <option value="male">مرد</option>
              <option value="female">زن</option>
              <option value="other">سایر</option>
              <option value="prefer_not">ترجیح می‌دهم نگویم</option>
            </select>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...listenerForm.register("privacy")} />
            <span>
              سیاست{" "}
              <button
                type="button"
                className="text-[var(--accent)] underline"
                onClick={() => setPrivacyOpen(true)}
              >
                حریم خصوصی
              </button>{" "}
              را می‌پذیرم.
            </span>
          </label>
          {listenerForm.formState.errors.privacy && (
            <p className="text-xs text-red-400">{listenerForm.formState.errors.privacy.message}</p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full">
            ثبت‌نام
          </Button>
        </form>
      ) : (
        <form className="mt-6 space-y-3" onSubmit={artistForm.handleSubmit(onArtist)}>
          <Input label="ایمیل" type="email" {...artistForm.register("email")} error={artistForm.formState.errors.email?.message} />
          <Input label="رمز عبور" type="password" {...artistForm.register("password")} error={artistForm.formState.errors.password?.message} />
          <Input label="نام هنری" {...artistForm.register("stageName")} error={artistForm.formState.errors.stageName?.message} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[var(--muted)]">نمونه کارها</span>
            <textarea
              className="min-h-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              {...artistForm.register("sampleWorks")}
            />
            {artistForm.formState.errors.sampleWorks && (
              <span className="text-xs text-red-400">{artistForm.formState.errors.sampleWorks.message}</span>
            )}
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full">
            ارسال درخواست
          </Button>
          <p className="text-xs text-[var(--muted)]">پس از ارسال، وضعیت «در انتظار تأیید» خواهد بود.</p>
        </form>
      )}

      <Link href="/login" className="mt-4 inline-block text-sm text-[var(--muted)] hover:underline">
        قبلاً ثبت‌نام کرده‌اید؟ ورود
      </Link>

      <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="سیاست حریم خصوصی">
        <div className="space-y-3 text-sm leading-7 text-[var(--muted)]">
          <p>
            داده‌های حساب شما روی سرور Melody ذخیره می‌شود و برای ورود از دستگاه‌های مختلف همگام می‌گردد.
          </p>
          <p>
            در فاز دوم، پردازش داده‌ها مطابق قوانین حریم خصوصی سامانه و استانداردهای امنیت انجام خواهد شد.
          </p>
        </div>
      </Modal>
    </div>
  );
}
