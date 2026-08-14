"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table } from "@/components/ui/Table";
import { useAppStore } from "@/stores/appStore";

export default function ArtistRequestsPage() {
  const users = useAppStore((s) => s.users);
  const approveArtist = useAppStore((s) => s.approveArtist);
  const rejectArtist = useAppStore((s) => s.rejectArtist);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const pending = users.filter(
    (u) => u.role === "artist" && u.artistProfile?.status === "pending"
  );
  const detail = users.find((u) => u.id === detailId);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">درخواست‌های تأیید هنرمند</h1>
      <Table headers={["نام هنری", "ایمیل", "عملیات"]}>
        {pending.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">{u.artistProfile?.stageName || u.displayName}</td>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3">
              <Button variant="secondary" onClick={() => setDetailId(u.id)}>
                مشاهده نمونه کارها
              </Button>
            </td>
          </tr>
        ))}
      </Table>
      {pending.length === 0 && (
        <p className="text-sm text-[var(--muted)]">درخواست معلقی وجود ندارد.</p>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title="جزئیات درخواست"
      >
        {detail && (
          <div className="space-y-4">
            <p>
              <span className="text-[var(--muted)]">نام هنری: </span>
              {detail.artistProfile?.stageName}
            </p>
            <p>
              <span className="text-[var(--muted)]">ایمیل: </span>
              {detail.email}
            </p>
            <div>
              <p className="mb-1 text-[var(--muted)]">نمونه کارها</p>
              <pre className="whitespace-pre-wrap rounded-xl bg-[var(--background)] p-3 text-sm">
                {detail.artistProfile?.sampleWorks}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  approveArtist(detail.id);
                  setDetailId(null);
                }}
              >
                Approve / تأیید
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setRejectOpen(true);
                }}
              >
                Reject / رد
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="علت رد">
        <textarea
          className="min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="دلیل رد درخواست را بنویسید"
        />
        <Button
          className="mt-3"
          variant="danger"
          onClick={() => {
            if (!detailId || !reason.trim()) return;
            rejectArtist(detailId, reason.trim());
            setRejectOpen(false);
            setDetailId(null);
            setReason("");
          }}
        >
          تأیید رد
        </Button>
      </Modal>
    </div>
  );
}
