"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { AdminSidebar } from "@/components/Sidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AuthGuard roles={["admin", "support"]}>
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>
        {open && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="relative z-10 h-full">
              <AdminSidebar />
            </div>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-[var(--border)] p-3 md:hidden">
            <Button variant="ghost" className="!p-2" onClick={() => setOpen((v) => !v)}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </Button>
            <span className="font-display text-lg font-bold text-[var(--accent)]">Admin</span>
          </div>
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
