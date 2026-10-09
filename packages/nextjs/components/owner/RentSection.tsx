"use client";

import { useState } from "react";
import { Banner, Field, type Result, Spinner, focusField, inputClass, translateServerError, useOwnerT } from "./ui";
import { validateRent } from "./validate";
import { IntInput } from "~~/components/IntInput";
import { friendlyError, num, rp } from "~~/lib/format";
import { useSaleInfo } from "~~/lib/hooks";
import { PropertyProvider, useMetaMap, useProp, useProperties } from "~~/lib/properties";

function RentForm({ passcode, onPasscodeProblem }: { passcode: string; onPasscodeProblem: (msg: string) => void }) {
  const t = useOwnerT();
  const info = useSaleInfo();
  const { info: prop } = useProp();
  const [perUnit, setPerUnit] = useState(100);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const circulating = Number(info.circulating ?? 0n);
  const amount = circulating * perUnit;
  const errors = validateRent({ passcode, perUnit });
  const perUnitError = tried ? errors.perUnit : undefined;

  async function deposit() {
    setResult(null);
    setTried(true);
    if (errors.passcode) {
      onPasscodeProblem(errors.passcode.msg);
      focusField("passcode");
      return;
    }
    if (errors.perUnit) {
      focusField("perUnit");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/rent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode, propertyId: prop.id, amount }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Gagal");
      setResult({ ok: true, text: t("Sewa {amount} dibagikan.", { amount: rp(amount) }), hash: json.hash });
      setTried(false);
      void info.refetch();
    } catch (e) {
      const text = translateServerError(friendlyError(e), t);
      if (text.includes("Kode operator") || (e instanceof Error && e.message.includes("Kode operator"))) {
        onPasscodeProblem(text);
        focusField("passcode");
      }
      setResult({ ok: false, text });
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset disabled={busy} className="min-w-0">
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-muted">{t("Unit beredar")}</dt>
          <dd className="num text-lg font-black">{num(circulating)}</dd>
          <dd className="text-[11px] text-muted">{t("unit yang sudah terjual")}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs text-muted">{t("Sudah dibagikan sejauh ini")}</dt>
          <dd className="num text-lg font-black">{rp(info.rentPaid)}</dd>
          <dd className="text-[11px] text-muted">{t("total sewa yang pernah disetor")}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <Field field="perUnit" id="f-per-unit" label="Sewa per unit (Rp)" required error={perUnitError}>
          <IntInput
            id="f-per-unit"
            className={inputClass(!!perUnitError)}
            aria-invalid={!!perUnitError}
            value={perUnit}
            onChange={setPerUnit}
          />
        </Field>
      </div>

      <div className="mt-3 rounded-xl bg-brand-soft p-4 text-brand-deep">
        <p className="text-xs font-semibold">{t("Total yang akan disetor")}</p>
        <p className="num text-3xl font-black">{rp(amount)}</p>
        <p className="num text-xs">
          {t("{units} unit × {price} per unit", { units: num(circulating), price: rp(perUnit) })}
        </p>
      </div>

      {circulating === 0 && (
        <p className="mt-2 text-xs text-muted">
          {t("Belum ada unit terjual di properti ini, jadi belum ada yang bisa menerima sewa.")}
        </p>
      )}

      <button className="btn-main mt-4" disabled={busy || circulating === 0} onClick={deposit}>
        {busy ? (
          <>
            <Spinner />
            {t("Memproses…")}
          </>
        ) : (
          t("Setor {amount}", { amount: rp(amount) })
        )}
      </button>
      <Banner result={result} />
    </fieldset>
  );
}

export function RentSection({
  passcode,
  onPasscodeProblem,
}: {
  passcode: string;
  onPasscodeProblem: (msg: string) => void;
}) {
  const t = useOwnerT();
  const { data: properties } = useProperties();
  const metas = useMetaMap(properties);
  const [selected, setSelected] = useState(0);
  const current = properties?.find(p => p.id === selected) ?? properties?.[0];

  return (
    <section id="rent" className="card scroll-mt-20 p-5">
      <span className="chip">{t("Pemilik kos (demo)")}</span>
      <h2 className="mt-2 text-xl font-black">{t("Setor sewa bulan ini")}</h2>
      <p className="text-sm text-muted">
        {t("Sewa dibagi ke semua unit yang sudah terjual. Unit yang belum terjual tidak menerima sewa.")}
      </p>
      <p className="mt-1 text-sm text-muted">
        {t("Setoran masuk ke kontrak sewa, lalu setiap pemegang unit bisa mengambil bagiannya sesuai jumlah unit.")}
      </p>
      <p className="mt-2 text-xs text-muted">
        <span className="text-red-600" aria-hidden="true">
          *
        </span>{" "}
        {t("wajib diisi")}
      </p>

      <div className="mt-3">
        <Field field="property" id="f-property" label="Properti" required>
          <select
            id="f-property"
            className={inputClass()}
            value={current?.id ?? 0}
            onChange={e => setSelected(Number(e.target.value))}
          >
            {metas.map(({ info, meta }) => (
              <option key={info.id} value={info.id}>
                {meta?.name ?? `#${info.id + 1}`}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {current ? (
        <PropertyProvider key={current.id} info={current}>
          <RentForm passcode={passcode} onPasscodeProblem={onPasscodeProblem} />
        </PropertyProvider>
      ) : (
        <p className="mt-3 text-sm text-muted">{t("Belum ada properti.")}</p>
      )}
    </section>
  );
}
