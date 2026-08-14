import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 shadow-sm",
  secondary:
    "bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface-3)]",
  ghost: "bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground)]",
  danger: "bg-red-600 text-white hover:bg-red-500",
  outline:
    "border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
