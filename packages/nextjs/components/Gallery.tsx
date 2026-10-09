"use client";

import { useState } from "react";

/** Property photos: one large image with thumbnails underneath. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const current = images[Math.min(index, images.length - 1)];
  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        referrerPolicy="no-referrer"
        src={current}
        alt={alt}
        className="h-56 w-full rounded-t-[1.25rem] object-cover"
      />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-2">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setIndex(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? "border-brand" : "border-transparent"}`}
              aria-label={`${alt} ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img referrerPolicy="no-referrer" src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
