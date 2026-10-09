"use client";

import { createContext, useContext, useMemo } from "react";
import { type Address, type PropertyContracts, contractsFor, factory, isDeployed } from "./contracts";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useReadContract, useReadContracts } from "wagmi";

export type PropertyInfo = {
  id: number;
  token: Address;
  sale: Address;
  distributor: Address;
  market: Address;
  creator: Address;
  metadataURI: string;
};

export type Meta = {
  name: string;
  city: string;
  rooms: number;
  occupancy: number;
  totalValue: number;
  about: string;
  aboutEn?: string;
  images: string[];
  documents: string[];
  documentsEn?: string[];
};

/** Fetches the offchain property JSON and makes its image links absolute. */
export const metaQuery = (uri: string) => ({
  queryKey: ["meta", uri],
  enabled: !!uri,
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<Meta> => {
    const res = await fetch(uri);
    const json = await res.json();
    const base = uri.startsWith("data:") ? "https://ursset.vercel.app" : uri;
    const abs = (u: string) => {
      try {
        return new URL(u, base).toString();
      } catch {
        return u;
      }
    };
    return {
      name: String(json.name ?? "Properti"),
      city: String(json.city ?? ""),
      rooms: Number(json.rooms ?? 0),
      occupancy: Number(json.occupancy ?? 0),
      totalValue: Number(json.totalValue ?? 0),
      about: String(json.about ?? ""),
      aboutEn: json.aboutEn ? String(json.aboutEn) : undefined,
      documentsEn: Array.isArray(json.documentsEn) ? json.documentsEn.map(String) : undefined,
      images: Array.isArray(json.images) ? json.images.map((i: string) => abs(String(i))) : [],
      documents: Array.isArray(json.documents) ? json.documents.map(String) : [],
    };
  },
});

export function useProperties() {
  const count = useReadContract({
    ...factory,
    functionName: "propertyCount",
    query: { enabled: isDeployed, refetchInterval: 10_000 },
  });
  const ids = Array.from({ length: Number(count.data ?? 0n) }, (_, i) => BigInt(i));
  const rows = useReadContracts({
    allowFailure: false,
    contracts: ids.map(id => ({ ...factory, functionName: "properties", args: [id] }) as const),
    query: { enabled: ids.length > 0, refetchInterval: 15_000 },
  });
  const data: PropertyInfo[] | undefined = useMemo(
    () =>
      rows.data?.map((r, i) => ({
        id: i,
        token: r[0],
        sale: r[1],
        distributor: r[2],
        market: r[3],
        creator: r[4],
        metadataURI: r[5],
      })),
    [rows.data],
  );
  return { data, isLoading: count.isLoading || rows.isLoading, count: Number(count.data ?? 0n) };
}

/** Property names and photos for a list of properties, fetched in parallel. */
export function useMetaMap(properties: PropertyInfo[] | undefined) {
  const results = useQueries({ queries: (properties ?? []).map(p => metaQuery(p.metadataURI)) });
  return (properties ?? []).map((p, i) => ({ info: p, meta: results[i]?.data as Meta | undefined }));
}

type Ctx = { info: PropertyInfo; meta?: Meta; c: PropertyContracts; name: string };
const PropertyContext = createContext<Ctx | null>(null);

export function PropertyProvider({ info, children }: { info: PropertyInfo; children: React.ReactNode }) {
  const { data: meta } = useQuery(metaQuery(info.metadataURI));
  const c = useMemo(() => contractsFor(info), [info]);
  const value = useMemo(() => ({ info, meta, c, name: meta?.name ?? `Properti #${info.id + 1}` }), [info, meta, c]);
  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProp() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProp must be used inside a PropertyProvider");
  return ctx;
}
