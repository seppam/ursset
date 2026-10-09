<p align="center"><img src="packages/nextjs/public/logo.png" alt="URSSET" width="360"></p>

# URSSET: urunan asset

**3 langkah, kamu punya aset.** Urunan bareng teman beli bagian rumah kos, terima sewanya, dan jual lagi kapan saja.

Built for the [Ethereum Jakarta Hackathon 2026](https://www.hackquest.io/hackathons/Ethereum-Jakarta-Hackathon-2026) (theme: Real-World Assets) on Robinhood Chain Testnet, an Ethereum L2.

| | |
| --- | --- |
| Live app | _TODO: Vercel URL_ |
| Demo video | _TODO: video URL_ |
| Chain | Robinhood Chain Testnet (chain ID 46630) |
| Explorer | https://explorer.testnet.chain.robinhood.com |

> This is a hackathon demo on a test network. Property data is illustrative, "Rupiah" is a test token (tIDR), and nothing here is an investment offer or promises any return.

## The problem

- Property needs large capital, so most young Indonesians are locked out.
- On fractional platforms, money is often locked up and investors must trust the operator's rent reports.
- Crypto-based products ask normal people to understand wallets, gas and seed phrases.

## What URSSET does

A fractional rental-property app whose UX hides the blockchain but keeps every important fact verifiable onchain.

1. **Masuk.** Sign in with email or Google. A wallet is created silently (Privy embedded wallet), no seed phrase, no gas.
2. **Isi saldo.** Top up Rupiah (QRIS is simulated; the balance is test Rupiah). A light identity check marks the wallet as verified.
3. **Urunan.** Pick an amount, tap once. You now own units of a rental property.

On top of that:

- **Urunan Room.** Create a room with a target, share one link, and friends join with their own amounts. Everyone receives units in their own wallet; nobody holds anyone else's money.
- **Public rent history.** Every rent deposit and its pro rata split is an onchain event anyone can check ("Lihat bukti di blockchain" on every transaction).
- **Resale.** Sell units to other verified investors at a price you set.
- **List any property in one transaction.** The operator form (`/operator`) takes a name, city, rooms, value, description and photos, then `PropertyFactory` deploys that property's token, sale, rent distributor and marketplace and wires them together. Photos go to Vercel Blob (or paste image links).
- **Two languages.** The whole UI switches between Indonesian and English from the header (ID | EN).
- **Compliance in code.** Units can only move between wallets verified in the `KYCRegistry`. A transfer to an unverified wallet is rejected by the smart contract, not by the app.

## Why onchain

Ownership, rent payouts and resale between investors happen on a public ledger the operator does not control, so investors can verify for themselves without trusting a database, while KYC rules are enforced directly by the contract.

## Architecture

```
Investor (Next.js app, Privy login)          Operator (server, Next.js API routes)
   buy / sell / claim / create room            gas drip, KYC flag, mint tIDR, deposit rent
              \                                       /
               v                                     v
        +--------------------------------------------------------+
        |              Robinhood Chain Testnet (46630)           |
        |                                                        |
        |  PrimarySale   RentDistributor   Marketplace           |
        |        \              |              /                 |
        |         +---------> PropertyToken <--+----> KYCRegistry |
        |                       (units)         (checked on      |
        |  MockIDR (tIDR)                        every transfer) |
        +--------------------------------------------------------+
```

| Contract | Role |
| --- | --- |
| `PropertyFactory` | Lists a property in one transaction: deploys and wires `PropertyToken`, `RentDistributor`, `PrimarySale` and `Marketplace`, verifies the sale contract and mints the unit inventory, then hands ownership to the operator. Only the operator can call it. |
| `KYCRegistry` | Allow-list of verified wallets. Only an address and a boolean are stored, never personal data. |
| `MockIDR` | Test Rupiah (tIDR, zero decimals). Simulates a balance topped up through a licensed payment provider. |
| `PropertyToken` | ERC-20 units of one property (300,000 units). `_update` requires both sides to be verified. Stores the legal-document hash. |
| `RentDistributor` | Splits rent deposits pro rata with an accumulator, so cost does not grow with the number of holders. Unsold inventory earns no rent. |
| `PrimarySale` | Fixed-price primary sale (Rp10,000 per unit) and Urunan Rooms (target, progress, contributors). |
| `Marketplace` | Non-custodial fixed-price resale. Units stay in the seller's wallet and keep earning rent until filled. |

The shared contracts (`KYCRegistry`, `MockIDR`, `PropertyFactory`) are written to [`packages/nextjs/lib/generated/ursset.ts`](packages/nextjs/lib/generated/ursset.ts) after each deploy. Each listed property's own contract addresses come from `PropertyFactory.properties(id)`. Current deployment: _TODO: list addresses with explorer links after the final deploy._

## Run it locally

Requirements: Node 20+, Yarn, [Foundry](https://book.getfoundry.sh/getting-started/installation).

```bash
yarn install
cd packages/foundry && forge test            # 26 tests

# Frontend
cp packages/nextjs/.env.example packages/nextjs/.env.local   # then fill in the values
yarn start                                                   # http://localhost:3000
```

Deploy contracts to Robinhood Chain Testnet (needs testnet ETH from the [faucet](https://faucet.testnet.chain.robinhood.com)):

```bash
cd packages/foundry
cp .env.example .env                         # add DEPLOYER_PRIVATE_KEY (testnet-only wallet)
export METADATA_BASE=https://YOUR-APP.vercel.app   # where /properties/*.json for the two seed properties is hosted
forge script script/Deploy.s.sol --rpc-url robinhood --private-key "$DEPLOYER_PRIVATE_KEY" --broadcast --ffi
node scripts-js/exportUrsset.mjs 46630       # writes ABIs and addresses for the frontend
```

Smoke test the deployed contracts with two throwaway investors (onboarding, Urunan Room, rent, resale, KYC rejection):

```bash
cd packages/nextjs && node scripts/e2e.mjs
```

Optional photo upload needs a Vercel Blob store: in the Vercel dashboard open Storage, create a Blob store and connect it to the project (this sets `BLOB_READ_WRITE_TOKEN`). Without it the operator form still works with pasted image links.

The domain of Robinhood Chain's RPC is blocked by some Indonesian ISPs. If calls fail with a TLS error, switch your DNS to `1.1.1.1`, or set `NEXT_PUBLIC_RPC_URL` to this app's own `/api/rpc` proxy.

## Tests

`packages/foundry/test/URSSET.t.sol` covers:

- Factory: wiring, independent properties, operator-only listing, rent deposits after creation, role checks.
- KYC: unverified buyers and receivers are rejected, revoked wallets cannot send.
- Sale: payment and delivery, sold-out limit, Urunan Room progress and per-person ownership.
- Rent: pro rata split, unsold inventory earns nothing, late buyers get no past rent, rent follows units after a transfer, only the operator can deposit.
- Marketplace: sale, unverified buyer rejected, seller keeps earning rent while listed, only the seller can cancel.

## Built during the hackathon, and what we reused

Everything in `packages/foundry/contracts`, `packages/foundry/test`, `packages/foundry/script/Deploy.s.sol`, `packages/foundry/scripts-js/exportUrsset.mjs`, and `packages/nextjs` (pages, components, API routes, hooks) was written during the hackathon.

Third-party code and services, with attribution:

- [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2) (project scaffold, Foundry setup and `generateTsAbis` tooling). Its example UI was removed.
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) 5.x (ERC-20, Ownable, SafeERC20).
- [Foundry](https://github.com/foundry-rs/foundry) and forge-std.
- [Privy](https://www.privy.io) (email and Google login, embedded wallets, server-side token verification).
- Next.js, React, wagmi, viem, TanStack Query, Tailwind CSS, qrcode.react.

## Limits, and what comes next

- **Testnet only.** Rupiah is simulated with a test token; the QRIS top-up is a simulation. The identity check is a demo flag and no personal data is collected.
- **Test token shortcut.** `MockIDR` skips the approve step for the sale, marketplace and distributor so a purchase is one transaction. A production setup would use a licensed payment provider and normal approvals or permits.
- **Operator is trusted.** One server key verifies wallets, mints test Rupiah and deposits rent. In production, KYC comes from a licensed provider and rent from the SPV's bank account via a licensed payment service provider.
- **Legal structure.** In production the property is held by an SPV (PT); investors hold economic rights represented by the token, not the land certificate. The hash of legal documents is stored in the token. Tokenized property rights are likely regulated by OJK in Indonesia; the plan is the OJK Regulatory Sandbox route, as earlier property tokenization players took, with Rupiah in and out through a licensed payment provider.
- **Next:** pilot with one real boarding house, sandbox application, licensed payment partner, secondary-market fees, multiple properties.

## Business model

Listing fee from the property owner (assumption: 3% of funds raised), because owners need capital for renovation or new rooms without bank collateral. Investors pay no platform fee. Secondary-market fees are a later phase.

## License

MIT, see [LICENCE](LICENCE).
