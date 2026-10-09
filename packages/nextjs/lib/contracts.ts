import { abis, deployment } from "./generated/ursset";

const a = deployment.addresses;

export const kyc = { address: a.KYCRegistry, abi: abis.KYCRegistry } as const;
export const idr = { address: a.MockIDR, abi: abis.MockIDR } as const;
export const token = { address: a.PropertyToken, abi: abis.PropertyToken } as const;
export const distributor = { address: a.RentDistributor, abi: abis.RentDistributor } as const;
export const sale = { address: a.PrimarySale, abi: abis.PrimarySale } as const;
export const market = { address: a.Marketplace, abi: abis.Marketplace } as const;

export const DEPLOY_BLOCK = BigInt(deployment.deployBlock);
export const isDeployed = (a.PropertyToken as string) !== "0x0000000000000000000000000000000000000000";
