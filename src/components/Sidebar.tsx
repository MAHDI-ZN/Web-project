"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Disc3,
  Home,
  LayoutDashboard,
  ListMusic,
  LogOut,
  Settings,
  Ticket,
  UserRound,
  BadgeDollarSign,
  Mic2,
  Users,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function MainSidebar() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.getCurrentUser());
  const logout = useAppStore((s) => s.logout);
  const notifications = useAppStore((s) => s.notifications);
  const unread = notifications.filter((n) => n.userId === user?.id && !n.read).length;

  if (!user) return null;

  const items = [
    { href: "/home", label: "خانه", icon: Home },
    { href: "/browse", label: "آلبوم‌ها و تک‌آهنگ‌ها", icon: Disc3 },
    { href: "/playlists", label: "پلی‌لیست‌ها", icon: ListMusic },
    { href: `/profile/${user.id}`, label: "نمایه من", icon: UserRound },
    { href: "/notifications", label: "اعلان‌ها", icon: Bell, badge: unread },
    { href: "/settings", label: "تنظیمات", icon: Settings },
  ];

  if (user.role === "artist" && user.artistProfile?.status === "approved") {
    items.splice(3, 0, { href: "/artist-panel", label: "مدیریت آثار", icon: Mic2 });
  }

  if (user.role === "admin" || user.role === "support") {
    items.push({ href: "/admin/tickets", label: "داشبورد مدیریت", icon: LayoutDashboard });
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] p-4">
        <Link href="/home" className="font-display text-2xl font-bold tracking-tight text-[var(--accent)]">
          Melody
        </Link>
        <p className="mt-1 text-xs text-[var(--muted)]">استریم موسیقی</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && item.badge > 0 && (
                <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-[var(--accent-fg)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <div className="mb-2 flex items-center gap-3 px-2">
          <Avatar src={user.avatar} name={user.displayName} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.displayName}</p>
            <p className="truncate text-xs text-[var(--muted)]">@{user.username}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          <LogOut size={16} />
          خروج
        </Button>
      </div>
    </aside>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.getCurrentUser());
  const logout = useAppStore((s) => s.logout);

  if (!user) return null;
  const isAdmin = user.role === "admin";

  const items = [
    { href: "/admin/tickets", label: "تیکت‌ها", icon: Ticket },
    { href: "/admin/artist-requests", label: "تأیید هنرمندان", icon: Users },
    ...(isAdmin
      ? [
          { href: "/admin/accounting", label: "حسابرسی", icon: BadgeDollarSign },
          { href: "/admin/subscriptions", label: "اشتراک‌ها", icon: LayoutDashboard },
        ]
      : []),
    { href: "/home", label: "بازگشت به اپ", icon: Home },
  ];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] p-4">
        <p className="font-display text-xl font-bold text-[var(--accent)]">Melody Admin</p>
        <p className="text-xs text-[var(--muted)]">
          {isAdmin ? "مدیر سامانه" : "پشتیبان"}
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "hover:bg-[var(--surface-2)]"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--border)] p-3">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          <LogOut size={16} />
          خروج
        </Button>
      </div>
    </aside>
  );
}
