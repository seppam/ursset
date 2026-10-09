"use client";

import { use, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { CreateRoom } from "~~/components/CreateRoom";
import { Gallery } from "~~/components/Gallery";
import { Progress } from "~~/components/Progress";
import { PropertyHero, TrustChips } from "~~/components/PropertyCard";
import { ThreeSteps } from "~~/components/ThreeSteps";
import { addressUrl, txUrl } from "~~/lib/chain";
import { DEPLOY_BLOCK } from "~~/lib/contracts";
import { num, rp } from "~~/lib/format";
import { abis } from "~~/lib/generated/ursset";
import { usePropMe, useSaleInfo } from "~~/lib/hooks";
import { useI18n, useT } from "~~/lib/i18n";
import { PropertyProvider, useProp, useProperties } from "~~/lib/properties";

function Detail() {
  const { t, lang } = useI18n();
  const { info, meta, c, name } = useProp();
  const sale = useSaleInfo();
  const me = usePropMe();
  const client = usePublicClient();
  const total = Number(sale.totalUnits ?? 0n);
  const sold =
    sale.totalUnits !== undefined && sale.unitsLeft !== undefined ? Number(sale.totalUnits - sale.unitsLeft) : 0;

  const rent = useQuery({
    queryKey: ["rent-history", info.distributor],
    enabled: !!client,
    refetchInterval: 8000,
    queryFn: async () => {
      const events = await client!.getContractEvents({
        address: info.distributor,
        abi: abis.RentDistributor,
        eventName: "RentDeposited",
        fromBlock: DEPLOY_BLOCK,
        strict: true,
      });
      return events.reverse();
    },
  });

  const panel = useRef<HTMLDivElement>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  useEffect(() => {
    const el = panel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPanelVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-6">
      <div className="space-y-4">
        <div className="card overflow-hidden">
          {meta && meta.images.length > 1 ? (
            <>
              <Gallery images={meta.images} alt={name} />
              <div className="px-4 pt-3">
                <h1 className="text-2xl font-black">{name}</h1>
                <p className="text-sm text-muted">{meta.city}</p>
              </div>
            </>
          ) : (
            <PropertyHero />
          )}
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="font-extrabold">{meta?.totalValue ? rp(meta.totalValue) : "–"}</p>
                <p className="text-xs text-muted">{t("nilai (ilustrasi)")}</p>
              </div>
              <div>
                <p className="font-extrabold">{meta ? `${meta.occupancy}%` : "–"}</p>
                <p className="text-xs text-muted">{t("terisi")}</p>
              </div>
              <div>
                <p className="font-extrabold">{num(total)}</p>
                <p className="text-xs text-muted">{t("total unit")}</p>
              </div>
            </div>
            <Progress value={sold} max={total} />
            <TrustChips />
            {me.units > 0n && <p className="chip">{t("Kamu punya {n} unit", { n: num(me.units) })}</p>}
          </div>
        </div>

        <section className="card p-4 text-sm">
          <h3 className="font-extrabold">{t("Cara kerjanya di properti ini")}</h3>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>{t("Kamu membeli unit; 1 unit = bagian kecil properti ini.")}</li>
            <li>{t("Sewa bulanan yang disetor pemilik dibagi sesuai jumlah unitmu.")}</li>
            <li>{t("Jual unit kapan saja di pasar sekunder lewat Portofolio.")}</li>
          </ul>
        </section>

        <section className="card p-4">
          <h3 className="font-extrabold">{t("Riwayat sewa (onchain)")}</h3>
          {rent.data?.length ? (
            <ul className="mt-2 divide-y divide-line text-sm">
              {rent.data.map(e => (
                <li key={e.transactionHash} className="flex items-center justify-between py-2">
                  <span>
                    {t("{amount} untuk {n} unit beredar", {
                      amount: rp(e.args.amount),
                      n: num(e.args.circulatingUnits),
                    })}
                  </span>
                  <a
                    className="text-xs font-semibold text-brand underline"
                    href={txUrl(e.transactionHash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("bukti")}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {t("Belum ada setoran sewa. Setiap setoran dan pembagiannya tercatat di sini dan bisa dicek siapa pun.")}
            </p>
          )}
        </section>

        <section className="card p-4 text-sm">
          <h3 className="font-extrabold">{t("Tentang properti")}</h3>
          <p className="mt-1 text-muted">{lang === "en" && meta?.aboutEn ? meta.aboutEn : meta?.about}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {(lang === "en" && meta?.documentsEn ? meta.documentsEn : meta?.documents)?.map(d => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            {t("Hash dokumen hukum disimpan di kontrak, jadi perubahan dokumen bisa dideteksi.")}
          </p>
          <a
            className="mt-2 inline-block text-xs font-semibold text-brand underline"
            href={addressUrl(c.token.address)}
            target="_blank"
            rel="noreferrer"
          >
            {t("Lihat kontrak di explorer")}
          </a>
        </section>
      </div>

      <aside className="space-y-4 md:sticky md:top-20">
        <div id="mulai" ref={panel} className="scroll-mt-20">
          <ThreeSteps />
        </div>
        <CreateRoom />
      </aside>

      {/* Mobile sticky call to action; hidden once the 3-step panel is on screen */}
      <div
        className={`fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-20 px-4 pb-2 transition md:hidden ${panelVisible ? "pointer-events-none translate-y-4 opacity-0" : ""}`}
      >
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-full bg-white p-2 pl-5 shadow-[var(--shadow-raised)] ring-1 ring-line">
          <p className="num min-w-0 flex-1 truncate text-sm">
            <b>{rp(sale.unitPrice ?? 10_000n)}</b> <span className="text-muted">/ {t("unit")}</span>
          </p>
          <a href="#mulai" className="btn-main !w-auto px-6">
            {t("Mulai urunan")}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const { data: properties, isLoading } = useProperties();
  const info = properties?.find(p => String(p.id) === id);

  if (isLoading || (!properties && !info))
    return (
      <div className="space-y-3" aria-busy>
        <div className="skeleton h-52 rounded-[1.25rem]" />
        <div className="skeleton h-24 rounded-[1.25rem]" />
        <div className="skeleton h-64 rounded-[1.25rem]" />
      </div>
    );
  if (!info) return <p className="pt-6 text-center text-muted">{t("Properti tidak ditemukan.")}</p>;
  return (
    <PropertyProvider info={info}>
      <Detail />
    </PropertyProvider>
  );
}
