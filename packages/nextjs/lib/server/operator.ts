import { robinhoodTestnet } from "../chain";
import { factory, idr, kyc } from "../contracts";
import { abis } from "../generated/ursset";
import { maxRentPerUnit } from "../rentLimits";
import { HttpError } from "./errors";
import {
  assertNotLocked,
  claimDrip,
  clientIp,
  rateLimit,
  recordFailure,
  recordSuccess,
  releaseDrip,
  safeEqual,
} from "./guard";
import { PrivyClient } from "@privy-io/server-auth";
import "server-only";
import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  isAddress,
  keccak256,
  parseEther,
  parseEventLogs,
  toBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const SERVER_RPC = process.env.SERVER_RPC_URL || "https://rpc.testnet.chain.robinhood.com";
const GAS_DRIP = parseEther(process.env.GAS_DRIP_ETH || "0.0001");
const MIN_GAS = GAS_DRIP / 3n;
export const MAX_BALANCE = 5_000_000n;

function operatorAccount() {
  const raw = process.env.DEPLOYER_PRIVATE_KEY;
  if (!raw) throw new HttpError(500, "Operator belum dikonfigurasi");
  return privateKeyToAccount((raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`);
}

export { HttpError };

export const publicClient = createPublicClient({ chain: robinhoodTestnet, transport: http(SERVER_RPC) });

function walletClient() {
  return createWalletClient({ account: operatorAccount(), chain: robinhoodTestnet, transport: http(SERVER_RPC) });
}

// The operator key signs every server action; run them one at a time so nonces never collide.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

const isNonceClash = (e: unknown) => /nonce|underpriced|already known/i.test(String((e as Error)?.message ?? e));

// Several serverless instances can share the operator key, so retry when two of them race for the same nonce.
async function mined(send: () => Promise<`0x${string}`>) {
  return serial(async () => {
    for (let attempt = 1; ; attempt++) {
      try {
        const hash = await send();
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        return { hash, receipt };
      } catch (e) {
        if (attempt >= 4 || !isNonceClash(e)) throw e;
        await new Promise(r => setTimeout(r, 400 * attempt));
      }
    }
  });
}

let privy: PrivyClient | null = null;

/** Checks the Privy access token and that the wallet really belongs to that signed-in user. */
export async function requireUser(req: Request, address: unknown): Promise<{ address: `0x${string}`; userId: string }> {
  if (typeof address !== "string" || !isAddress(address)) throw new HttpError(400, "Alamat tidak valid");
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const secret = process.env.PRIVY_APP_SECRET;
  if (!appId || !secret) throw new HttpError(500, "Privy belum dikonfigurasi");
  privy ??= new PrivyClient(appId, secret);

  const token = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!token) throw new HttpError(401, "Belum masuk");
  const claims = await privy.verifyAuthToken(token).catch(() => {
    throw new HttpError(401, "Sesi tidak valid, masuk lagi");
  });
  const user = await privy.getUser(claims.userId);
  const owns = user.linkedAccounts.some(
    a => a.type === "wallet" && "address" in a && a.address.toLowerCase() === address.toLowerCase(),
  );
  if (!owns) throw new HttpError(403, "Wallet bukan milik akun ini");
  return { address: getAddress(address), userId: claims.userId };
}

export async function requireOwner(req: Request, address: unknown): Promise<`0x${string}`> {
  return (await requireUser(req, address)).address;
}

/**
 * The operator code protects the owner-only actions (deposit rent, list a property, upload photos).
 * Compared in constant time, with a per-IP lockout after repeated failures.
 */
export async function requireOperatorCode(req: Request, code: unknown) {
  const ip = clientIp(req);
  assertNotLocked(ip);
  const expected = process.env.OPERATOR_PASSCODE;
  if (!expected || typeof code !== "string" || !safeEqual(code, expected)) {
    await recordFailure(ip);
    throw new HttpError(401, "Kode operator salah");
  }
  recordSuccess(ip);
}

const MAX_DRIPS_PER_HOUR = Number(process.env.MAX_DRIPS_PER_HOUR || 20);

/**
 * Sends the starter gas to a wallet. Limits: one drip per Privy user (durable when Blob is configured), a rate
 * limit per IP, a cap on drips per hour, and no drip if the wallet already holds enough gas.
 */
export async function dripGas(req: Request, userId: string, to: `0x${string}`) {
  rateLimit(`drip-ip:${clientIp(req)}`, 5, 10 * 60_000);
  const balance = await publicClient.getBalance({ address: to });
  if (balance >= MIN_GAS) return null;
  if (!(await claimDrip(userId))) return null;
  try {
    rateLimit("drip-total", MAX_DRIPS_PER_HOUR, 3600_000, "Gas gratis sedang habis untuk jam ini, coba lagi nanti");
    return (await mined(() => walletClient().sendTransaction({ to, value: GAS_DRIP }))).hash;
  } catch (e) {
    releaseDrip(userId);
    throw e;
  }
}

export async function verifyWallet(to: `0x${string}`) {
  const already = await publicClient.readContract({ ...kyc, functionName: "isVerified", args: [to] });
  if (already) return null;
  return (await mined(() => walletClient().writeContract({ ...kyc, functionName: "setVerified", args: [to, true] })))
    .hash;
}

export async function mintRupiah(to: `0x${string}`, amount: bigint) {
  const balance = await publicClient.readContract({ ...idr, functionName: "balanceOf", args: [to] });
  if (balance + amount > MAX_BALANCE) throw new HttpError(400, "Batas saldo demo tercapai");
  return (await mined(() => walletClient().writeContract({ ...idr, functionName: "mint", args: [to, amount] }))).hash;
}

/** Looks up a listed property in the factory so callers cannot point the operator at arbitrary contracts. */
export async function getProperty(id: number) {
  if (!Number.isInteger(id) || id < 0) throw new HttpError(400, "Properti tidak valid");
  const count = await publicClient.readContract({ ...factory, functionName: "propertyCount" });
  if (BigInt(id) >= count) throw new HttpError(404, "Properti tidak ditemukan");
  const [token, sale, distributor] = await publicClient.readContract({
    ...factory,
    functionName: "properties",
    args: [BigInt(id)],
  });
  return { token, sale, distributor };
}

/**
 * Guardrail: one deposit may not pay more than RENT_MAX_PCT_OF_UNIT_PRICE of the unit price per unit, so a typo
 * or a leaked code cannot push the operator's whole tIDR balance to holders at once.
 */
async function assertRentWithinLimit(sale: `0x${string}`, distributor: `0x${string}`, amount: bigint) {
  const [unitPrice, units] = await Promise.all([
    publicClient.readContract({ address: sale, abi: abis.PrimarySale, functionName: "unitPrice" }),
    publicClient.readContract({ address: distributor, abi: abis.RentDistributor, functionName: "circulating" }),
  ]);
  if (units === 0n)
    throw new HttpError(400, "Belum ada unit terjual di properti ini, jadi belum ada yang bisa menerima sewa.");
  if (amount > units * BigInt(maxRentPerUnit(Number(unitPrice))))
    throw new HttpError(400, "Sewa per unit terlalu besar: maksimal 5% dari harga unit per setoran");
}

export async function depositRent(propertyId: number, amount: bigint) {
  if (amount < 1n) throw new HttpError(400, "Nominal sewa harus bilangan bulat lebih dari 0");
  const { sale, distributor } = await getProperty(propertyId);
  await assertRentWithinLimit(sale, distributor, amount);
  const owner = operatorAccount().address;
  // The distributor pulls tIDR from the operator like any ERC-20 spender, so approve it once per property.
  const allowance = await publicClient.readContract({ ...idr, functionName: "allowance", args: [owner, distributor] });
  if (allowance < amount) {
    await mined(() =>
      walletClient().writeContract({ ...idr, functionName: "approve", args: [distributor, 2n ** 255n] }),
    );
  }
  return (
    await mined(() =>
      walletClient().writeContract({
        address: distributor,
        abi: abis.RentDistributor,
        functionName: "depositRent",
        args: [amount],
      }),
    )
  ).hash;
}

export type ListingInput = {
  name: string;
  city: string;
  rooms: number;
  occupancy: number;
  totalValue: number;
  about: string;
  images: string[];
  documents: string[];
  unitPrice: number;
};

const symbolOf = (name: string) =>
  name
    .replace(/^kos\s+/i, "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 6)
    .toUpperCase() || "KOS";

/** Lists a property: stores its metadata and deploys the whole contract set through the factory. */
export async function listProperty(input: ListingInput, metadataURI: string, metadataJson: string) {
  const totalUnits = BigInt(Math.floor(input.totalValue / input.unitPrice));
  const { hash, receipt } = await mined(() =>
    walletClient().writeContract({
      ...factory,
      functionName: "createProperty",
      args: [
        {
          name: input.name,
          symbol: symbolOf(input.name),
          location: input.city,
          totalUnits,
          unitPrice: BigInt(input.unitPrice),
          documentHash: keccak256(toBytes(metadataJson)),
          metadataURI,
          treasury: "0x0000000000000000000000000000000000000000",
        },
      ],
    }),
  );
  const [event] = parseEventLogs({ abi: abis.PropertyFactory, eventName: "PropertyCreated", logs: receipt.logs });
  return { hash, propertyId: Number(event.args.id), totalUnits };
}

export function fail(e: unknown) {
  const status = e instanceof HttpError ? e.status : 500;
  const message = e instanceof HttpError ? e.message : "Terjadi kesalahan di server";
  if (!(e instanceof HttpError)) console.error(e);
  return Response.json({ error: message }, { status });
}
