"use client";

import { useEffect, useRef, useState } from "react";
import { CITIES, searchCities } from "~~/lib/cities";
import { useT } from "~~/lib/i18n";

/** Searchable list of Indonesian cities. Typing narrows the list; only listed cities can be chosen. */
export function CityPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (city: string) => void;
  className: string;
}) {
  const t = useT();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const results = searchCities(query);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) {
        setOpen(false);
        // Snap back to the chosen city if the typed text was not picked from the list.
        setQuery(prev => (CITIES.includes(prev) ? prev : value));
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [value]);

  return (
    <div ref={box} className="relative">
      <input
        className={className}
        value={query}
        placeholder={t("Cari kota…")}
        onFocus={() => setOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-white p-1 shadow-lg">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">{t("Kota tidak ditemukan")}</li>}
          {results.map(city => (
            <li key={city}>
              <button
                type="button"
                className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-soft ${city === value ? "font-bold text-brand-dark" : "text-ink"}`}
                onClick={() => {
                  onChange(city);
                  setQuery(city);
                  setOpen(false);
                }}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
