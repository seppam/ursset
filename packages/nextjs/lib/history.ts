"use client";

import { DEPLOY_BLOCK, idr, isDeployed } from "./contracts";
import { abis } from "./generated/ursset";
import { useProperties } from "./properties";
import { useQuery } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import { usePublicClient } from "wagmi";

export type HistoryKind = "topup" | "buy" | "claim" | "list" | "sold" | "bought" | "send" | "receive";

export type HistoryItem = {
  kind: HistoryKind;
  propertyId?: number;
  amount?: bigint; // Rupiah
  units?: bigint;
  hash: string;
  block: bigint;
  index: number;
  time?: number; // unix seconds
};

/** Everything this wallet did, read from contract events. The chain is the record, so nothing is stored offchain. */
export function useHistory(address?: `0x${string}`) {
  const client = usePublicClient();
  const { data: properties } = useProperties();
  const key = properties?.map(p => p.token).join(",") ?? "";

  return useQuery({
    queryKey: ["history", address, key],
    enabled: isDeployed && !!client && !!address && !!properties?.length,
    refetchInterval: 12_000,
    queryFn: async (): Promise<HistoryItem[]> => {
      const c = client!;
      const me = address!;
      const from = DEPLOY_BLOCK;
      const items: HistoryItem[] = [];
      const push = (
        e: { transactionHash: string; blockNumber: bigint; logIndex: number },
        rest: Omit<HistoryItem, "hash" | "block" | "index">,
      ) => items.push({ ...rest, hash: e.transactionHash, block: e.blockNumber, index: e.logIndex });

      const topups = await c.getContractEvents({
        ...idr,
        eventName: "Transfer",
        args: { from: zeroAddress, to: me },
        fromBlock: from,
        strict: true,
      });
      topups.forEach(e => push(e, { kind: "topup", amount: e.args.value }));

      await Promise.all(
        properties!.map(async p => {
          const [buys, claims, listed, soldAsSeller, boughtAsBuyer, sent, received] = await Promise.all([
            c.getContractEvents({
              address: p.sale,
              abi: abis.PrimarySale,
              eventName: "UnitsBought",
              args: { buyer: me },
              fromBlock: from,
              strict: true,
            }),
            c.getContractEvents({
              address: p.distributor,
              abi: abis.RentDistributor,
              eventName: "RentClaimed",
              args: { holder: me },
              fromBlock: from,
              strict: true,
            }),
            c.getContractEvents({
              address: p.market,
              abi: abis.Marketplace,
              eventName: "Listed",
              args: { seller: me },
              fromBlock: from,
              strict: true,
            }),
            c.getContractEvents({
              address: p.market,
              abi: abis.Marketplace,
              eventName: "Sold",
              args: { seller: me },
              fromBlock: from,
              strict: true,
            }),
            c.getContractEvents({
              address: p.market,
              abi: abis.Marketplace,
              eventName: "Sold",
              args: { buyer: me },
              fromBlock: from,
              strict: true,
            }),
            c.getContractEvents({
              address: p.token,
              abi: abis.PropertyToken,
              eventName: "Transfer",
              args: { from: me },
              fromBlock: from,
              strict: true,
            }),
            c.getContractEvents({
              address: p.token,
              abi: abis.PropertyToken,
              eventName: "Transfer",
              args: { to: me },
              fromBlock: from,
              strict: true,
            }),
          ]);
          const id = p.id;
          buys.forEach(e => push(e, { kind: "buy", propertyId: id, units: e.args.units, amount: e.args.cost }));
          claims.forEach(e => push(e, { kind: "claim", propertyId: id, amount: e.args.amount }));
          listed.forEach(e => push(e, { kind: "list", propertyId: id, units: e.args.units, amount: e.args.unitPrice }));
          soldAsSeller.forEach(e =>
            push(e, { kind: "sold", propertyId: id, units: e.args.units, amount: e.args.cost }),
          );
          boughtAsBuyer.forEach(e =>
            push(e, { kind: "bought", propertyId: id, units: e.args.units, amount: e.args.cost }),
          );

          // Plain transfers only: purchases and resales already show up above with their own labels.
          const labelled = new Set([...buys, ...soldAsSeller, ...boughtAsBuyer].map(e => e.transactionHash));
          sent
            .filter(e => !labelled.has(e.transactionHash) && e.args.to !== zeroAddress)
            .forEach(e => push(e, { kind: "send", propertyId: id, units: e.args.value }));
          received
            .filter(
              e =>
                !labelled.has(e.transactionHash) &&
                e.args.from !== zeroAddress &&
                e.args.from.toLowerCase() !== p.sale.toLowerCase(),
            )
            .forEach(e => push(e, { kind: "receive", propertyId: id, units: e.args.value }));
        }),
      );

      items.sort((a, b) => (a.block === b.block ? b.index - a.index : Number(b.block - a.block)));
      const recent = items.slice(0, 40);

      // Timestamps for the visible rows only.
      const blocks = [...new Set(recent.map(i => i.block))];
      const stamps = new Map<bigint, number>();
      await Promise.all(
        blocks.map(async b => {
          try {
            stamps.set(b, Number((await c.getBlock({ blockNumber: b })).timestamp));
          } catch {
            // a missing timestamp just hides the time
          }
        }),
      );
      return recent.map(i => ({ ...i, time: stamps.get(i.block) }));
    },
  });
}
