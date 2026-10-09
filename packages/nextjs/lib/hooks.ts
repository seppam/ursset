"use client";

import { useCallback } from "react";
import { DEPLOY_BLOCK, distributor, idr, isDeployed, kyc, market, sale, token } from "./contracts";
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import { parseEventLogs } from "viem";
import { useAccount, useBalance, usePublicClient, useReadContracts, useWriteContract } from "wagmi";

/** Everything the signed-in investor needs on screen, refreshed every few seconds. */
export function useMe() {
  const { address } = useAccount();
  const enabled = !!address && isDeployed;
  const { data, refetch, isLoading } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...idr, functionName: "balanceOf", args: [address!] },
      { ...token, functionName: "balanceOf", args: [address!] },
      { ...kyc, functionName: "isVerified", args: [address!] },
      { ...distributor, functionName: "pending", args: [address!] },
    ],
    query: { enabled, refetchInterval: 4000 },
  });
  const eth = useBalance({ address, query: { enabled: !!address, refetchInterval: 6000 } });

  return {
    address,
    loading: isLoading,
    idr: data?.[0] ?? 0n,
    units: data?.[1] ?? 0n,
    verified: data?.[2] ?? false,
    pendingRent: data?.[3] ?? 0n,
    eth: eth.data?.value ?? 0n,
    refetch: () => {
      void refetch();
      void eth.refetch();
    },
  };
}

/** Property level numbers: unsold units, price, rooms and total rent paid out. */
export function useSaleInfo() {
  const { data, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...sale, functionName: "unitsLeft" },
      { ...sale, functionName: "unitPrice" },
      { ...sale, functionName: "roomCount" },
      { ...distributor, functionName: "totalDeposited" },
      { ...distributor, functionName: "circulating" },
      { ...token, functionName: "totalUnits" },
    ],
    query: { enabled: isDeployed, refetchInterval: 5000 },
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
      await client!.simulateContract({ ...request, account });
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
  who?: string;
  units?: bigint;
  amount: bigint;
  roomId?: bigint;
  hash: string;
  block: bigint;
};

/** Recent purchases and rent deposits, read straight from contract events. */
export function useActivity(limit = 8) {
  const client = usePublicClient();
  return useQuery({
    queryKey: ["activity", limit],
    enabled: isDeployed && !!client,
    refetchInterval: 8000,
    queryFn: async (): Promise<Activity[]> => {
      const [buys, rents] = await Promise.all([
        client!.getContractEvents({ ...sale, eventName: "UnitsBought", fromBlock: DEPLOY_BLOCK, strict: true }),
        client!.getContractEvents({
          ...distributor,
          eventName: "RentDeposited",
          fromBlock: DEPLOY_BLOCK,
          strict: true,
        }),
      ]);
      const rows: Activity[] = [
        ...buys.map(e => ({
          kind: "buy" as const,
          who: e.args.buyer,
          units: e.args.units,
          amount: e.args.cost,
          roomId: e.args.roomId,
          hash: e.transactionHash,
          block: e.blockNumber,
        })),
        ...rents.map(e => ({
          kind: "rent" as const,
          amount: e.args.amount,
          hash: e.transactionHash,
          block: e.blockNumber,
        })),
      ];
      return rows.sort((a, b) => Number(b.block - a.block)).slice(0, limit);
    },
  });
}

export { parseEventLogs, market };
