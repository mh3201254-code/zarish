"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { compressToWebP } from "@/lib/image";
import { useToast } from "@/lib/store";

const BUCKET = "product-images";

export function publicPath(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

export async function uploadImage(file: File): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase is not configured");
  const blob = await compressToWebP(file);
  const path = `uploads/${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function ImageUploader({
  images,
  onChange,
  max = 8,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const next = [...images];
    for (const f of Array.from(files)) {
      if (next.length >= max) {
        toast(`You can add up to ${max} images`, "error");
        break;
      }
      try {
        next.push(await uploadImage(f));
      } catch (e) {
        toast(`Could not upload ${f.name}: ${(e as Error).message}`, "error");
      }
    }
    onChange(next);
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((url, i) => (
          <li
            key={url}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag !== null) move(drag, i);
              setDrag(null);
            }}
            className={`group relative aspect-[4/5] overflow-hidden border ${drag === i ? "border-gold opacity-60" : "border-line"}`}
          >
            <Image src={url} alt={`Product image ${i + 1}`} fill sizes="160px" className="object-cover" />
            {i === 0 && <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[10px] font-medium text-[#1a0d10]">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-bg/80 p-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <button type="button" aria-label="Move earlier" onClick={() => move(i, i - 1)} className="p-1"><ArrowLeft size={15} /></button>
              <button type="button" aria-label="Remove image" onClick={() => onChange(images.filter((_, k) => k !== i))} className="p-1 text-red-300"><X size={15} /></button>
              <button type="button" aria-label="Move later" onClick={() => move(i, i + 1)} className="p-1"><ArrowRight size={15} /></button>
            </div>
          </li>
        ))}
        {images.length < max && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="grid aspect-[4/5] w-full place-items-center border border-dashed border-line text-sm text-muted transition-colors hover:border-gold hover:text-ivory disabled:opacity-50"
            >
              <span className="grid place-items-center gap-2">
                <ImagePlus size={22} />
                {busy ? "Uploading" : "Add images"}
              </span>
            </button>
          </li>
        )}
      </ul>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      <p className="mt-2 text-xs text-muted">Images are converted to WebP (about 300KB or less) before upload. Drag to reorder, first image is the cover.</p>
    </div>
  );
}
