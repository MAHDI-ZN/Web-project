"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/stores/appStore";
import { formatNumber } from "@/lib/utils";
import { TrackCard } from "@/components/cards/MediaCards";
import { api } from "@/lib/api";

export default function ArtistPanelPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.getCurrentUser());
  const tracks = useAppStore((s) => s.tracks);
  const albums = useAppStore((s) => s.albums);
  const users = useAppStore((s) => s.users);
  const publishTrack = useAppStore((s) => s.publishTrack);
  const updateTrack = useAppStore((s) => s.updateTrack);
  const deleteTrack = useAppStore((s) => s.deleteTrack);
  const createAlbum = useAppStore((s) => s.createAlbum);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("پاپ");
  const [year, setYear] = useState(2026);
  const [lyrics, setLyrics] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [publishType, setPublishType] = useState<"single" | "album">("single");
  const [albumTitle, setAlbumTitle] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [report, setReport] = useState<Awaited<ReturnType<typeof api.artistReport>> | null>(null);

  const myTracks = useMemo(
    () => tracks.filter((t) => user && t.artistIds.includes(user.id)),
    [tracks, user]
  );

  useEffect(() => {
    if (user?.role === "artist" && user.artistProfile?.status === "approved") {
      void api.artistReport().then(setReport).catch(() => setReport(null));
    }
  }, [user]);

  if (!user) return null;

  if (user.role !== "artist" || user.artistProfile?.status !== "approved") {
    return (
      <div className="rounded-3xl bg-[var(--surface)] p-6">
        <h1 className="text-2xl font-bold">مدیریت آثار</h1>
        <p className="mt-2 text-[var(--muted)]">
          فقط هنرمندان تأییدشده به این بخش دسترسی دارند.
          {user.artistProfile?.status === "pending" && " وضعیت شما: در انتظار تأیید."}
          {user.artistProfile?.status === "rejected" &&
            ` وضعیت شما: رد شده — ${user.artistProfile.rejectionReason || ""}`}
        </p>
        <Button className="mt-4" onClick={() => router.push("/home")}>
          بازگشت
        </Button>
      </div>
    );
  }

  const resetForm = () => {
    setTitle("");
    setGenre("پاپ");
    setYear(2026);
    setLyrics("");
    setCollaborators("");
    setPublishType("single");
    setAlbumTitle("");
    setAudioFile(null);
    setCoverFile(null);
    setEditId(null);
  };

  const onSubmit = async () => {
    if (!title.trim() || (!audioFile && !editId) || (!coverFile && !editId)) {
      setMessage("عنوان، فایل صوتی و کاور الزامی است.");
      return;
    }

    const collabIds = collaborators
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => users.find((u) => (u.artistProfile?.stageName || u.displayName) === name)?.id)
      .filter(Boolean) as string[];

    let albumId: string | undefined;
    if (!editId && publishType === "album") {
      const albumForm = new FormData();
      albumForm.append("title", albumTitle.trim() || title.trim());
      albumForm.append("genre", genre);
      albumForm.append("year", String(year));
      if (coverFile) albumForm.append("cover", coverFile);
      const album = await createAlbum(albumForm);
      albumId = album.id;
    }

    const form = new FormData();
    form.append("title", title.trim());
    form.append("genre", genre);
    form.append("year", String(year));
    form.append("lyrics", lyrics);
    form.append("isSingle", String(publishType === "single"));
    collabIds.forEach((id) => form.append("collaboratorIds", id));
    if (albumId) form.append("albumId", albumId);
    if (audioFile) form.append("audio", audioFile);
    if (coverFile) form.append("cover", coverFile);

    if (editId) {
      await updateTrack(editId, form);
      setMessage("اثر ویرایش شد.");
      resetForm();
      return;
    }

    const res = await publishTrack(form);
    setMessage(res.ok ? "اثر منتشر شد." : res.error || "خطا");
    if (res.ok) resetForm();
  };

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">مدیریت آثار</h1>

      {report && (
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--muted)]">استریم ماه {report.month}</p>
            <p className="mt-1 text-2xl font-bold">{formatNumber(report.totals.streams)}</p>
          </div>
          <div className="rounded-3xl bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--muted)]">شنونده یکتا</p>
            <p className="mt-1 text-2xl font-bold">{formatNumber(report.totals.uniqueListeners)}</p>
          </div>
          <div className="rounded-3xl bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--muted)]">درآمد محاسبه‌شده</p>
            <p className="mt-1 text-2xl font-bold text-[var(--accent)]">
              {formatNumber(report.totals.revenue)} تومان
            </p>
          </div>
        </section>
      )}

      <section className="space-y-4 rounded-3xl bg-[var(--surface)] p-5">
        <h2 className="font-semibold">{editId ? "ویرایش اثر" : "انتشار اثر جدید"}</h2>
        <p className="text-xs text-[var(--muted)]">
          فایل صوتی با فرمت MP3 / WAV / FLAC و کاور JPG/PNG روی سرور ذخیره می‌شود.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="ژانر" value={genre} onChange={(e) => setGenre(e.target.value)} />
          <Input
            label="سال انتشار"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <Input
            label="هنرمندان همکار (با کاما جدا کنید)"
            value={collaborators}
            onChange={(e) => setCollaborators(e.target.value)}
          />
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">نوع انتشار</span>
          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            value={publishType}
            onChange={(e) => setPublishType(e.target.value as "single" | "album")}
          >
            <option value="single">تک‌آهنگ</option>
            <option value="album">آلبوم</option>
          </select>
        </label>
        {publishType === "album" && (
          <Input
            label="نام آلبوم"
            value={albumTitle}
            onChange={(e) => setAlbumTitle(e.target.value)}
          />
        )}
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">متن آهنگ</span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">فایل صوتی (MP3/WAV/FLAC)</span>
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/flac,audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">کاور</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {message && <p className="text-sm text-[var(--accent)]">{message}</p>}
        <div className="flex gap-2">
          <Button onClick={() => void onSubmit()}>{editId ? "ذخیره تغییرات" : "انتشار"}</Button>
          {editId && (
            <Button variant="secondary" onClick={resetForm}>
              انصراف
            </Button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">آثار من</h2>
        {myTracks.map((track) => {
          const album = track.albumId ? albums.find((a) => a.id === track.albumId) : undefined;
          const row = report?.tracks.find((t) => t.id === track.id);
          return (
            <div key={track.id} className="space-y-2 rounded-2xl bg-[var(--surface)] p-3">
              <TrackCard track={track} queue={myTracks} />
              <div className="flex flex-wrap items-center gap-2 px-2 text-sm text-[var(--muted)]">
                <span>
                  {formatNumber(row?.listeners ?? track.listeners)} شنونده ·{" "}
                  {formatNumber(row?.streams ?? track.streams)} استریم · درآمد:{" "}
                  {formatNumber(row?.revenue ?? 0)} تومان
                </span>
                {album && <span>· آلبوم: {album.title}</span>}
              </div>
              <div className="flex gap-2 px-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditId(track.id);
                    setTitle(track.title);
                    setGenre(track.genre);
                    setYear(track.year);
                    setLyrics(track.lyrics || "");
                    setPublishType(track.isSingle ? "single" : "album");
                  }}
                >
                  ویرایش
                </Button>
                <Button variant="danger" onClick={() => void deleteTrack(track.id)}>
                  حذف
                </Button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
