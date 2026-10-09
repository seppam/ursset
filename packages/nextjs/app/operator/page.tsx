"use client";

import { useState } from "react";
import { ListingForm } from "~~/components/owner/ListingForm";
import { RentSection } from "~~/components/owner/RentSection";
import { Field, inputClass, useOwnerT } from "~~/components/owner/ui";

export default function Operator() {
  const t = useOwnerT();
  const [passcode, setPasscode] = useState("");
  // The message only shows while the code is unchanged, so typing a new one clears it.
  const [problem, setProblem] = useState<{ msg: string; snap: string } | null>(null);
  const error = problem && problem.snap === passcode ? { msg: problem.msg } : undefined;
  const flag = (msg: string) => setProblem({ msg, snap: passcode });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <p className="eyebrow">{t("Pemilik kos (demo)")}</p>
        <h1 className="text-2xl font-black">{t("Kelola properti")}</h1>
        <p className="text-sm text-muted">
          {t("Daftarkan kos baru atau setor sewa bulan ini. Semua data di sini adalah data uji.")}
        </p>
        <nav className="mt-3 flex gap-2" aria-label={t("Bagian halaman")}>
          <a href="#rent" className="chip-neutral chip">
            {t("Setor sewa")}
          </a>
          <a href="#listing" className="chip-neutral chip">
            {t("Daftarkan properti")}
          </a>
        </nav>
      </header>

      <section className="card p-5">
        <Field field="passcode" id="f-passcode" label="Kode operator" required error={error}>
          <input
            id="f-passcode"
            type="password"
            autoComplete="off"
            className={inputClass(!!error)}
            aria-invalid={!!error}
            aria-describedby="passcode-hint"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
          />
        </Field>
        <p id="passcode-hint" className="mt-1 text-xs text-muted">
          {t("Kode khusus pemilik/panitia demo. Dipakai untuk setor sewa dan mendaftarkan properti.")}
        </p>
      </section>

      <div className="space-y-4">
        <RentSection passcode={passcode} onPasscodeProblem={flag} />
        <ListingForm passcode={passcode} onPasscodeProblem={flag} />
      </div>
    </div>
  );
}
