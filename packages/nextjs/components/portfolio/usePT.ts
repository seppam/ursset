"use client";

import { useCallback } from "react";
import { useI18n } from "~~/lib/i18n";
import { enPortfolio } from "~~/lib/i18n-portfolio";

/** Like useT(), but also knows the portfolio-only English strings from lib/i18n-portfolio.ts. */
export function usePT() {
  const { lang, t } = useI18n();
  return useCallback(
    (text: string, vars?: Record<string, string | number>) =>
      t(lang === "en" ? (enPortfolio[text] ?? text) : text, vars),
    [lang, t],
  );
}
