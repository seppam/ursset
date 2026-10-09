"use client";

import { useCallback } from "react";
import { DEPLOY_BLOCK, idr, isDeployed, kyc, tokenErrors } from "./contracts";
import { abis } from "./generated/ursset";
import { useProp, useProperties } from "./properties";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useBalance, usePublicClient, useReadContracts, useWriteContract } from "wagmi";

/** What the signed-in investor has across the whole app: test Rupiah, verification and gas. */
export function useMe() {
  const { address } = useAccount();
  const enabled = !!address && isDeployed;
  const { data, refetch, isLoading } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...idr, functionName: "balanceOf", args: [address!] },
      { ...kyc, functionName: "isVerified", args: [address!] },
    ],
    query: { enabled, refetchInterval: 4000 },
  });
  const eth = useBalance({ address, query: { enabled: !!address, refetchInterval: 6000 } });

  return {
    address,
    loading: isLoading,
    idr: data?.[0] ?? 0n,
    verified: data?.[1] ?? false,
    eth: eth.data?.value ?? 0n,
    refetch: () => {
      void refetch();
      void eth.refetch();
    },
  };
}

/** The investor's units and pending rent in the current property. */
export function usePropMe() {
  const { address } = useAccount();
  const { c } = useProp();
  const { data, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...c.token, functionName: "balanceOf", args: [address!] },
      { ...c.distributor, functionName: "pending", args: [address!] },
    ],
    query: { enabled: !!address, refetchInterval: 4000 },
  });
  return { units: data?.[0] ?? 0n, pendingRent: data?.[1] ?? 0n, refetch };
}

/** Numbers for the current property: unsold units, price, rooms and total rent paid out. */
export function useSaleInfo() {
  const { c } = useProp();
  const { data, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...c.sale, functionName: "unitsLeft" },
      { ...c.sale, functionName: "unitPrice" },
      { ...c.sale, functionName: "roomCount" },
      { ...c.distributor, functionName: "totalDeposited" },
      { ...c.distributor, functionName: "circulating" },
      { ...c.token, functionName: "totalUnits" },
    ],
    query: { refetchInterval: 5000 },
  });
  return {
    unitsLeft: data?.[0],
    unitPrice: data?.[1],
    roomCount: data?.[2],
    rentPaid: data?.[3],
    circulating: data?.[4],
    totalUnits: data?.[5],
    refetch,
  };
}

/** Sends a transaction and waits until it is mined. Returns the hash and the receipt. */
export function useSend() {
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient();
  const { address: account } = useAccount();
  return useCallback(
    async (request: any) => {
      // Simulating first lets viem decode contract errors (for example NotVerified) into readable messages.
      await client!.simulateContract({ ...request, abi: [...request.abi, ...tokenErrors], account });
      const hash = await writeContractAsync(request);
      const receipt = await client!.waitForTransactionReceipt({ hash });
      return { hash, receipt };
    },
    [writeContractAsync, client, account],
  );
}

/** POSTs JSON to our own API with the Privy access token so the server knows who is asking. */
export function usePost() {
  const { getAccessToken } = usePrivy();
  return useCallback(
    async (path: string, body: unknown) => {
      const accessToken = await getAccessToken();
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Permintaan gagal");
      return json as Record<string, unknown>;
    },
    [getAccessToken],
  );
}

export type Activity = {
  kind: "buy" | "rent";
  propertyId: number;
  who?: string;
  units?: bigint;
  amount: bigint;
  roomId?: bigint;
  hash: string;
  block: bigint;
};

/** Recent purchases and rent deposits across all properties, read straight from contract events. */
export function useActivity(limit = 8) {
  const client = usePublicClient();
  const { data: properties } = useProperties();
  const key = properties?.map(p => p.sale).join(",") ?? "";
  return useQuery({
    queryKey: ["activity", limit, key],
    enabled: isDeployed && !!client && !!properties?.length,
    refetchInterval: 8000,
    queryFn: async (): Promise<Activity[]> => {
      const perProperty = await Promise.all(
        properties!.map(async p => {
          const [buys, rents] = await Promise.all([
            client!.getContractEvents({
              address: p.sale,
              abi: abis.PrimarySale,
              eventName: "UnitsBought",
              fromBlock: DEPLOY_BLOCK,
              strict: true,
            }),
            client!.getContractEvents({
              address: p.distributor,
              abi: abis.RentDistributor,
              eventName: "RentDeposited",
              fromBlock: DEPLOY_BLOCK,
              strict: true,
            }),
          ]);
          return [
            ...buys.map(e => ({
              kind: "buy" as const,
              propertyId: p.id,
              who: e.args.buyer,
              units: e.args.units,
              amount: e.args.cost,
              roomId: e.args.roomId,
              hash: e.transactionHash,
              block: e.blockNumber,
            })),
            ...rents.map(e => ({
              kind: "rent" as const,
              propertyId: p.id,
              amount: e.args.amount,
              hash: e.transactionHash,
              block: e.blockNumber,
            })),
          ] satisfies Activity[];
        }),
      );
      return perProperty
        .flat()
        .sort((a, b) => Number(b.block - a.block))
        .slice(0, limit);
    },
  });
}
