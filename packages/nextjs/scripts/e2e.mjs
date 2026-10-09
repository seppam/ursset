// Smoke test against the deployed contracts: two throwaway investors run the whole product flow.
// Usage (from packages/nextjs): node scripts/e2e.mjs   (PROPERTY_ID=1 to pick another listed property)
import { readFileSync } from "fs";
import { createPublicClient, createWalletClient, defineChain, http, parseEther, formatEther, decodeEventLog } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const load = p => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const env = Object.fromEntries(readFileSync(new URL("../../foundry/.env", import.meta.url), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#")).map(l => [l.split("=")[0], l.slice(l.indexOf("=") + 1)]));
const gen = readFileSync(new URL("../lib/generated/ursset.ts", import.meta.url), "utf8");
const addresses = Object.fromEntries([...gen.slice(0, gen.indexOf("export const abis")).matchAll(/"?(\w+)"?:\s*"(0x[0-9a-fA-F]{40})"/g)].map(m => [m[1], m[2]]));
const abi = n => load(`../../foundry/out/${n}.sol/${n}.json`).abi;

const rpc = "https://rpc.testnet.chain.robinhood.com";
const chain = defineChain({ id: 46630, name: "Robinhood Chain Testnet", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [rpc] } } });
const pub = createPublicClient({ chain, transport: http(rpc) });
const operator = privateKeyToAccount(`0x${env.DEPLOYER_PRIVATE_KEY.replace(/^0x/, "")}`);
const wallet = acc => createWalletClient({ account: acc, chain, transport: http(rpc) });

const factory = { address: addresses.PropertyFactory, abi: abi("PropertyFactory") };
const propertyId = BigInt(process.env.PROPERTY_ID ?? 0);
const [tokenAddr, saleAddr, distAddr, marketAddr] = await pub.readContract({ ...factory, functionName: "properties", args: [propertyId] });

const c = {
  kyc: { address: addresses.KYCRegistry, abi: abi("KYCRegistry") },
  idr: { address: addresses.MockIDR, abi: abi("MockIDR") },
  token: { address: tokenAddr, abi: abi("PropertyToken") },
  dist: { address: distAddr, abi: abi("RentDistributor") },
  sale: { address: saleAddr, abi: abi("PrimarySale") },
  market: { address: marketAddr, abi: abi("Marketplace") },
};

let spent = 0n;
async function tx(acc, label, send) {
  const hash = await send(wallet(acc));
  const r = await pub.waitForTransactionReceipt({ hash });
  const cost = r.gasUsed * r.effectiveGasPrice;
  spent += acc.address === operator.address ? cost : 0n;
  console.log(`  ✓ ${label.padEnd(34)} gas ${String(r.gasUsed).padStart(8)}  ${formatEther(cost)} ETH`);
  return r;
}
const read = (k, fn, args = []) => pub.readContract({ ...c[k], functionName: fn, args });
const check = (ok, text) => { console.log(`${ok ? "PASS" : "FAIL"}  ${text}`); if (!ok) process.exitCode = 1; };

const dina = privateKeyToAccount(generatePrivateKey());
const budi = privateKeyToAccount(generatePrivateKey());
const stranger = privateKeyToAccount(generatePrivateKey());
console.log("Operator", operator.address, "balance", formatEther(await pub.getBalance({ address: operator.address })));

console.log("\n1. Onboarding: gas, KYC, top-up");
for (const [name, a] of [["dina", dina], ["budi", budi]]) {
  await tx(operator, `gas drip ${name}`, w => w.sendTransaction({ to: a.address, value: parseEther("0.0001") }));
  await tx(operator, `verify ${name}`, w => w.writeContract({ ...c.kyc, functionName: "setVerified", args: [a.address, true] }));
  await tx(operator, `mint 500000 tIDR ${name}`, w => w.writeContract({ ...c.idr, functionName: "mint", args: [a.address, 500000n] }));
}

console.log("\n2. Urunan Room");
const created = await tx(dina, "dina creates room", w => w.writeContract({ ...c.sale, functionName: "createRoom", args: ["E2E room", 1000n] }));
const roomId = created.logs.map(l => { try { return decodeEventLog({ abi: c.sale.abi, ...l }); } catch { return null; } }).find(e => e?.eventName === "RoomCreated").args.roomId;
await tx(dina, "dina buys 5 units in room", w => w.writeContract({ ...c.sale, functionName: "buy", args: [5n, roomId] }));
await tx(budi, "budi buys 10 units in room", w => w.writeContract({ ...c.sale, functionName: "buy", args: [10n, roomId] }));
const room = await read("sale", "rooms", [roomId]);
check(room[3] === 15n && room[4] === 2n, `room #${roomId} raised ${room[3]} units from ${room[4]} people`);
check((await read("token", "balanceOf", [dina.address])) === 5n, "dina owns 5 units");
check((await read("idr", "balanceOf", [dina.address])) === 450000n, "dina paid Rp50.000");

console.log("\n3. Rent");
const circ = await read("dist", "circulating");
await tx(operator, "operator deposits rent", w => w.writeContract({ ...c.dist, functionName: "depositRent", args: [circ * 100n] }));
const pend = await read("dist", "pending", [dina.address]);
check(pend === 500n, `dina pending rent Rp${pend} (expected Rp500 of Rp${circ * 100n})`);
await tx(dina, "dina claims rent", w => w.writeContract({ ...c.dist, functionName: "claim" }));
check((await read("idr", "balanceOf", [dina.address])) === 450500n, "dina balance includes rent");

console.log("\n4. Resale");
await tx(dina, "dina approves marketplace", w => w.writeContract({ ...c.token, functionName: "approve", args: [c.market.address, 2n] }));
await tx(dina, "dina lists 2 units @ Rp12.000", w => w.writeContract({ ...c.market, functionName: "list", args: [2n, 12000n] }));
const listingId = await read("market", "listingCount");
await tx(budi, "budi buys listing", w => w.writeContract({ ...c.market, functionName: "buy", args: [listingId] }));
check((await read("token", "balanceOf", [budi.address])) === 12n, "budi owns 12 units after resale");

console.log("\n5. KYC enforced by the contract");
try {
  await pub.simulateContract({ ...c.token, functionName: "transfer", args: [stranger.address, 1n], account: dina.address });
  check(false, "transfer to unverified wallet should revert");
} catch (e) {
  const name = e.walk?.(x => x?.data?.errorName)?.data?.errorName;
  check(name === "NotVerified", `transfer to unverified wallet rejected (${name})`);
}
try {
  await pub.simulateContract({ ...c.sale, abi: [...c.sale.abi, ...c.token.abi.filter(x => x.type === "error")], functionName: "buy", args: [1n, 0n], account: stranger.address });
  check(false, "unverified buy should revert");
} catch (e) {
  check(e.walk?.(x => x?.data?.errorName)?.data?.errorName === "NotVerified", "unverified wallet cannot buy");
}

console.log(`\nOperator spent ${formatEther(spent)} ETH on this run (incl. gas drips). Operator balance now ${formatEther(await pub.getBalance({ address: operator.address }))}`);
