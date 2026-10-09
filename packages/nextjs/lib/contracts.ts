import { abis, deployment } from "./generated/ursset";

const a = deployment.addresses;

// Deployed once. Each listed property has its own contracts, whose addresses the factory knows.
export const kyc = { address: a.KYCRegistry, abi: abis.KYCRegistry } as const;
export const idr = { address: a.MockIDR, abi: abis.MockIDR } as const;
export const factory = { address: a.PropertyFactory, abi: abis.PropertyFactory } as const;

export const DEPLOY_BLOCK = BigInt(deployment.deployBlock);
export const isDeployed = (a.PropertyFactory as string) !== "0x0000000000000000000000000000000000000000";

export type Address = `0x${string}`;
export type PropertyAddrs = { token: Address; sale: Address; distributor: Address; market: Address };

export const contractsFor = (p: PropertyAddrs) =>
  ({
    token: { address: p.token, abi: abis.PropertyToken },
    sale: { address: p.sale, abi: abis.PrimarySale },
    distributor: { address: p.distributor, abi: abis.RentDistributor },
    market: { address: p.market, abi: abis.Marketplace },
  }) as const;

export type PropertyContracts = ReturnType<typeof contractsFor>;

// Sales and marketplaces bubble up errors raised by the token (for example NotVerified).
export const tokenErrors = abis.PropertyToken.filter(item => item.type === "error");
