"use client";

import { useCallback } from "react";
import Link from "next/link";
import type { Problem } from "./validate";
import { txUrl } from "~~/lib/chain";
import { useI18n } from "~~/lib/i18n";
import { ownerEn } from "~~/lib/i18n-owner";

type Vars = Record<string, string | number>;

/**
 * Same contract as `useT()` from ~~/lib/i18n. It looks in the owner dictionary first, then falls back to the shared
 * one, so the owner area is translated without editing the shared dictionary.
 */
export function useOwnerT() {
  const { lang, t } = useI18n();
  return useCallback(
    (text: string, vars?: Vars) => (lang === "en" && ownerEn[text] ? t(ownerEn[text], vars) : t(text, vars)),
    [lang, t],
  );
}
export type OwnerT = ReturnType<typeof useOwnerT>;

/** Input styling shared by every field. `invalid` switches to the red state. */
export const inputClass = (invalid?: boolean) =>
  `mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-base text-ink placeholder:text-slate-400 disabled:opacity-60 md:text-sm ${
    invalid ? "border-red-500 ring-1 ring-red-500" : "border-line"
  }`;

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      role="presentation"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Required() {
  const t = useOwnerT();
  return (
    <>
      <span className="ml-0.5 text-red-600" aria-hidden="true">
        *
      </span>
      <span className="sr-only">{t("wajib diisi")}</span>
    </>
  );
}

/** Label + control + hint + error. `field` is the key used to scroll and focus the first invalid field. */
export function Field({
  field,
  id,
  label,
  required,
  optional,
  hint,
  error,
  children,
}: {
  field: string;
  id?: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: Problem;
  children: React.ReactNode;
}) {
  const t = useOwnerT();
  const labelId = `${field}-label`;
  const body = (
    <>
      {t(label)}
      {required && <Required />}
      {optional && <span className="ml-1 font-normal text-muted">{t("(opsional)")}</span>}
    </>
  );
  return (
    <div data-field={field} role={id ? undefined : "group"} aria-labelledby={id ? undefined : labelId}>
      {id ? (
        <label htmlFor={id} className="text-xs font-semibold text-ink">
          {body}
        </label>
      ) : (
        <p id={labelId} className="text-xs font-semibold text-ink">
          {body}
        </p>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{t(hint)}</p>}
      {error && (
        <p id={`${field}-error`} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {t(error.msg, error.vars)}
        </p>
      )}
    </div>
  );
}

/** Scrolls a field into view and moves keyboard focus to its first control. */
export function focusField(field: string) {
  const root = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!root) return;
  const target =
    root.querySelector<HTMLElement>(
      "input:not([type=hidden]):not([disabled]),textarea,select,button:not([disabled])",
    ) ?? root;
  if (target === root) root.tabIndex = -1;
  root.scrollIntoView({ behavior: "smooth", block: "center" });
  target.focus({ preventScroll: true });
}

export type Result = { ok: boolean; text: string; hash?: string };

/** Success or error message that lives inside the card it belongs to. */
export function Banner({ result }: { result: Result | null }) {
  const t = useOwnerT();
  if (!result) return null;
  return (
    <p
      role={result.ok ? "status" : "alert"}
      className={`mt-3 rounded-xl p-3 text-sm ${result.ok ? "bg-brand-soft text-brand-dark" : "bg-red-50 text-red-700"}`}
    >
      {result.text}{" "}
      {result.hash && (
        <a className="font-semibold underline" href={txUrl(result.hash)} target="_blank" rel="noreferrer">
          {t("Lihat bukti di blockchain")}
        </a>
      )}
    </p>
  );
}

export function PropertyLink({ id }: { id: number }) {
  const t = useOwnerT();
  return (
    <Link className="font-semibold underline" href={`/p/${id}`}>
      {t("Lihat halaman properti")}
    </Link>
  );
}

/** Turns the server's Indonesian messages into the visitor's language. */
export function translateServerError(message: string, t: OwnerT): string {
  const range = /^(.+) harus antara (\d+) dan (\d+)$/.exec(message);
  if (range) return t("{label} harus antara {min} dan {max}", { label: t(range[1]), min: range[2], max: range[3] });
  return t(message);
}
