"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner, translateServerError, useOwnerT } from "./ui";
import { MAX_PHOTOS } from "./validate";

export type PhotoItem = {
  id: number;
  file: File;
  preview: string;
  status: "uploading" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
};

/** Shrinks a photo in the browser so uploads stay small and fast. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Gagal memproses gambar"))), "image/jpeg", 0.82),
  );
}

/** POSTs one photo to /api/upload with progress reporting (fetch cannot report upload progress). */
function send(body: FormData, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new Error("Koneksi terputus"));
    xhr.onload = () => {
      let json: { url?: string; error?: string } = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // non-JSON body, handled below
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.url) resolve(json.url);
      else reject(new Error(json.error ?? "Gagal mengunggah"));
    };
    xhr.send(body);
  });
}

/** Photos picked from the device: uploaded right away, each with its own progress and error. */
export function usePhotos(passcode: string) {
  const t = useOwnerT();
  const [items, setItems] = useState<PhotoItem[]>([]);
  const nextId = useRef(1);
  const previews = useRef<string[]>([]);

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, []);

  const patch = useCallback(
    (id: number, change: Partial<PhotoItem>) =>
      setItems(prev => prev.map(i => (i.id === id ? { ...i, ...change } : i))),
    [],
  );

  const run = useCallback(
    async (id: number, file: File) => {
      patch(id, { status: "uploading", progress: 0, error: undefined });
      try {
        if (!passcode.trim()) throw new Error("Isi Kode operator dulu, lalu coba lagi");
        const body = new FormData();
        body.set("passcode", passcode);
        body.set(
          "file",
          new File([await shrink(file)], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }),
        );
        const url = await send(body, pct => patch(id, { progress: pct }));
        patch(id, { status: "done", progress: 100, url });
      } catch (e) {
        patch(id, {
          status: "error",
          error: translateServerError(e instanceof Error ? e.message : "Gagal mengunggah", t),
        });
      }
    },
    [passcode, patch, t],
  );

  const add = useCallback(
    (files: FileList | null, linkCount: number) => {
      if (!files?.length) return;
      const room = Math.max(0, MAX_PHOTOS - items.length - linkCount);
      const picked = Array.from(files).slice(0, room);
      const fresh = picked.map(file => {
        const preview = URL.createObjectURL(file);
        previews.current.push(preview);
        return { id: nextId.current++, file, preview, status: "uploading" as const, progress: 0 };
      });
      setItems(prev => [...prev, ...fresh]);
      fresh.forEach(i => void run(i.id, i.file));
    },
    [items.length, run],
  );

  const remove = useCallback((id: number) => setItems(prev => prev.filter(i => i.id !== id)), []);
  const retry = useCallback(
    (id: number) => {
      const item = items.find(i => i.id === id);
      if (item) void run(id, item.file);
    },
    [items, run],
  );
  const reset = useCallback(() => setItems([]), []);

  return {
    items,
    add,
    remove,
    retry,
    reset,
    counts: {
      done: items.filter(i => i.status === "done").length,
      uploading: items.filter(i => i.status === "uploading").length,
      failed: items.filter(i => i.status === "error").length,
    },
  };
}

export type Photos = ReturnType<typeof usePhotos>;

/** Thumbnail grid with remove buttons, per-photo progress and retry on error. */
export function PhotoGrid({ photos, disabled }: { photos: Photos; disabled?: boolean }) {
  const t = useOwnerT();
  if (photos.items.length === 0) return null;
  return (
    <ul className="mt-3 grid grid-cols-3 gap-2">
      {photos.items.map((p, i) => (
        <li key={p.id} className="relative overflow-hidden rounded-xl border border-line bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.preview} alt={p.file.name} className="h-24 w-full object-cover" />
          {i === 0 && p.status === "done" && (
            <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
              {t("Sampul")}
            </span>
          )}
          {p.status === "uploading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/80 text-xs font-semibold text-ink">
              <Spinner className="text-brand" />
              <span className="num">{p.progress}%</span>
              <span className="mx-2 h-1 w-3/4 overflow-hidden rounded-full bg-line">
                <span className="block h-full bg-brand" style={{ width: `${p.progress}%` }} />
              </span>
            </div>
          )}
          {p.status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-50/95 p-1 text-center">
              <span className="line-clamp-3 text-[10px] leading-tight text-red-700">{p.error}</span>
              <button
                type="button"
                className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white"
                onClick={() => photos.retry(p.id)}
                disabled={disabled}
              >
                {t("Coba lagi")}
              </button>
            </div>
          )}
          <button
            type="button"
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-sm text-white"
            onClick={() => photos.remove(p.id)}
            disabled={disabled}
            aria-label={t("Hapus foto {name}", { name: p.file.name })}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
