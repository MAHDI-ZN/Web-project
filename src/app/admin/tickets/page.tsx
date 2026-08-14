"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { useAppStore } from "@/stores/appStore";
import type { TicketStatus } from "@/lib/types";

const statusLabel: Record<TicketStatus, string> = {
  open: "باز",
  answered: "پاسخ داده‌شده",
  closed: "بسته‌شده",
};

export default function TicketsPage() {
  const tickets = useAppStore((s) => s.tickets);
  const users = useAppStore((s) => s.users);
  const replyTicket = useAppStore((s) => s.replyTicket);
  const setTicketStatus = useAppStore((s) => s.setTicketStatus);
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const [reply, setReply] = useState("");

  const selected = tickets.find((t) => t.id === selectedId);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">تیکت‌های پشتیبانی</h1>
      <Table headers={["شناسه", "کاربر", "موضوع", "تاریخ", "وضعیت"]}>
        {tickets.map((t) => {
          const u = users.find((x) => x.id === t.userId);
          return (
            <tr
              key={t.id}
              className="cursor-pointer hover:bg-[var(--surface-2)]"
              onClick={() => setSelectedId(t.id)}
            >
              <td className="px-4 py-3">{t.id}</td>
              <td className="px-4 py-3">{t.userDisplayName || u?.displayName || "-"}</td>
              <td className="px-4 py-3">{t.subject}</td>
              <td className="px-4 py-3">{new Date(t.createdAt).toLocaleDateString("fa-IR")}</td>
              <td className="px-4 py-3">{statusLabel[t.status]}</td>
            </tr>
          );
        })}
      </Table>

      {selected && (
        <div className="rounded-3xl bg-[var(--surface)] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{selected.subject}</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setTicketStatus(selected.id, "closed")}>
                بستن تیکت
              </Button>
            </div>
          </div>
          <div className="mb-4 max-h-72 space-y-3 overflow-auto rounded-2xl bg-[var(--background)] p-4">
            {selected.messages.map((m) => {
              const sender = users.find((u) => u.id === m.senderId);
              return (
                <div key={m.id} className="rounded-xl bg-[var(--surface-2)] p-3">
                  <p className="text-xs text-[var(--muted)]">
                    {sender?.displayName} · {new Date(m.createdAt).toLocaleString("fa-IR")}
                  </p>
                  <p className="mt-1 text-sm">{m.body}</p>
                </div>
              );
            })}
          </div>
          <textarea
            className="min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            placeholder="پاسخ خود را بنویسید..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <Button
            className="mt-3"
            onClick={() => {
              if (!reply.trim()) return;
              replyTicket(selected.id, reply.trim());
              setReply("");
            }}
          >
            ارسال پاسخ
          </Button>
        </div>
      )}
    </div>
  );
}
