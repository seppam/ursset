"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { CreateRoom } from "~~/components/CreateRoom";
import { Progress } from "~~/components/Progress";
import { PropertyHero } from "~~/components/PropertyCard";
import { ThreeSteps } from "~~/components/ThreeSteps";
import { addressUrl, txUrl } from "~~/lib/chain";
import { DEPLOY_BLOCK, distributor, isDeployed, token } from "~~/lib/contracts";
import { num, rp } from "~~/lib/format";
import { useMe, useSaleInfo } from "~~/lib/hooks";
import { property } from "~~/lib/property";

export default function PropertyPage() {
  const info = useSaleInfo();
  const me = useMe();
  const client = usePublicClient();
  const sold =
    info.totalUnits !== undefined && info.unitsLeft !== undefined ? Number(info.totalUnits - info.unitsLeft) : 0;

  const rent = useQuery({
    queryKey: ["rent-history"],
    enabled: isDeployed && !!client,
    refetchInterval: 8000,
    queryFn: async () => {
      const events = await client!.getContractEvents({
        ...distributor,
        eventName: "RentDeposited",
        fromBlock: DEPLOY_BLOCK,
        strict: true,
      });
      return events.reverse();
    },
  });

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <PropertyHero />
        <div className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-extrabold">{rp(property.totalValue)}</p>
              <p className="text-xs text-muted">nilai (ilustrasi)</p>
            </div>
            <div>
              <p className="font-extrabold">{property.occupancy}%</p>
              <p className="text-xs text-muted">terisi</p>
            </div>
            <div>
              <p className="font-extrabold">{num(property.totalUnits)}</p>
              <p className="text-xs text-muted">total unit</p>
            </div>
          </div>
          <Progress value={sold} max={property.totalUnits} />
          {me.units > 0n && <p className="chip">Kamu punya {num(me.units)} unit</p>}
        </div>
      </div>

      <ThreeSteps />
      <CreateRoom />

      <section className="card p-4">
        <h3 className="font-extrabold">Riwayat sewa (onchain)</h3>
        {rent.data?.length ? (
          <ul className="mt-2 divide-y divide-line text-sm">
            {rent.data.map(e => (
              <li key={e.transactionHash} className="flex items-center justify-between py-2">
                <span>
                  {rp(e.args.amount)} untuk {num(e.args.circulatingUnits)} unit beredar
                </span>
                <a
                  className="text-xs font-semibold text-brand underline"
                  href={txUrl(e.transactionHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  bukti
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Belum ada setoran sewa. Setiap setoran dan pembagiannya tercatat di sini dan bisa dicek siapa pun.
          </p>
        )}
      </section>

      <section className="card p-4 text-sm">
        <h3 className="font-extrabold">Tentang properti</h3>
        <p className="mt-1 text-muted">{property.about}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          {property.documents.map(d => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Hash dokumen hukum disimpan di kontrak, jadi perubahan dokumen bisa dideteksi.
        </p>
        {isDeployed && (
          <a
            className="mt-2 inline-block text-xs font-semibold text-brand underline"
            href={addressUrl(token.address)}
            target="_blank"
            rel="noreferrer"
          >
            Lihat kontrak di explorer
          </a>
        )}
      </section>
    </div>
  );
}
