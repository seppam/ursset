# URSSET: HackQuest submission text

Ethereum Jakarta Hackathon 2026, theme: Real-World Assets. Deadline: Sat 10 Oct 2026, 12:00 WIB. Paste each block into the matching field.

## Project name
URSSET

## Tagline
Urunan asset: pool money with friends, own part of a rental property, collect verifiable rent.

## Short description (about 250 characters)
URSSET lets young Indonesians co-own a boarding house from Rp10,000. Sign in with email, top up, tap once. Rent deposits and payouts are public onchain, and KYC is enforced by the smart contracts. Testnet demo on Robinhood Chain, an Ethereum L2.

## Long description
URSSET ("urunan asset", Indonesian for "pooled asset") is a fractional rental-property app. A property is split into ERC-20 units that start at Rp10,000 each. Investors earn pro rata rent and can resell units to other verified investors.

The user experience hides the blockchain: sign in with email or Google (Privy embedded wallet, no seed phrase, gas covered by the app), top up simulated test Rupiah via QRIS plus a light identity check, then tap "Urunan". Friends can pool through an **Urunan Room**: one shared link and target, each person joins with their own amount, and units land in each person's own wallet, so nobody holds anyone else's money.

What stays verifiable onchain: ownership, every rent deposit and its pro rata split, and resale trades. Every transaction in the app links to "Lihat bukti di blockchain". Compliance is part of the contracts: `PropertyToken` only moves between wallets verified in `KYCRegistry`, so a transfer to an unverified wallet is rejected by the contract itself.

Property owners get an operator area to list a property (name, city, rooms, occupancy, value, photos) in one transaction through `PropertyFactory`, and to deposit monthly rent. The UI is mobile-first and available in Indonesian and English.

This is a hackathon demo: testnet only, illustrative property data, simulated QRIS and KYC, no real funds, no investment offer.

## Problem
- Property needs large capital, so most young Indonesians are locked out.
- On fractional platforms, investors usually have to trust the operator's rent reports and cannot check them independently.
- Crypto-based products ask ordinary people to manage wallets, gas and seed phrases.

## Solution
A three-step flow (sign in, top up, Urunan) that gives a user units of a rental property, with the facts that matter (ownership, rent deposits, payouts, trades) recorded on a public ledger the operator does not control. KYC rules are enforced by the token contract. Groups can buy together through an Urunan Room without anyone custodying others' money.

Why onchain: Ownership, rent payouts and trades between investors happen on a public ledger the operator does not control, so investors can verify for themselves without trusting a database, while KYC rules are enforced directly by the smart contract.

## RWA use case
Rental real estate (boarding houses, "kos") in Indonesia. Units represent economic rights to rent from a property. In production the property would be held by a legal-entity SPV and investors would hold rights to rent, not the land certificate; the token stores a hash of the legal documents. Seed properties in the demo (Kos Melati Depok, Kos Dago Asri Bandung) are illustrative.

Regulatory stance. Limit: tokens representing rights to property rent may be treated as financial products supervised by OJK, and payments in Indonesia must be in Rupiah. Path: we pursue the OJK Regulatory Sandbox, like earlier property tokenization precedents, with the property held by a legal-entity SPV and Rupiah in and out through a BI-licensed payment provider. Now: for the hackathon, testnet, non-custodial, illustrative property data, no real user funds.

## Business model (assumption to validate)
Listing fee from the property owner, about 3% of funds raised. Investors pay no platform fee. A secondary-market fee is a later phase.

## Competitive context
GORO (OJK Regulatory Sandbox graduate, Nov 2025) proves demand for fractional property from Rp10,000 with monthly rent and resale in Indonesia, and we respect that work. URSSET differs by adding the group Urunan Room, rent deposits and payouts verifiable by anyone onchain, KYC enforced by the smart contract, and no wallet or gas for the user.

## Tech stack
- Contracts: Solidity, Foundry, OpenZeppelin 5.x. Seven contracts: `KYCRegistry`, `PropertyToken`, `RentDistributor`, `PrimarySale` (with rooms), `Marketplace`, `PropertyFactory`, `MockIDR`.
- Chain: Robinhood Chain Testnet (Ethereum L2 for tokenized assets), chain ID 46630.
- Frontend: Next.js, React, wagmi, viem, TanStack Query, Tailwind CSS; Privy for email/Google login and embedded wallets; Vercel (hosting and Blob for photos).
- Tests: 26 Foundry tests plus an end-to-end script (`packages/nextjs/scripts/e2e.mjs`) that runs onboarding, Urunan Room, rent, resale and KYC rejection on the testnet.
- Scaffold: Scaffold-ETH 2.

## Built during the hackathon vs reused
Written during the hackathon: everything in `packages/foundry/contracts`, `packages/foundry/test`, `packages/foundry/script/Deploy.s.sol`, `packages/foundry/scripts-js/exportUrsset.mjs`, and `packages/nextjs` (pages, components, API routes, hooks).

Reused, with attribution: Scaffold-ETH 2 (project scaffold, Foundry setup, ABI generation tooling; example UI removed), OpenZeppelin Contracts 5.x (ERC-20, Ownable, SafeERC20), Foundry and forge-std, Privy (login, embedded wallets, token verification), and standard web libraries (Next.js, React, wagmi, viem, TanStack Query, Tailwind CSS, qrcode.react).

## Honest limits
Testnet only. QRIS and KYC are simulations. `MockIDR` skips approvals as a test-token shortcut. One operator key verifies wallets, mints test Rupiah and deposits rent; in production this becomes a licensed KYC provider and the SPV's bank rent via a licensed payment provider.

## Links
- Live app: https://ursset.vercel.app
- GitHub: https://github.com/seppam/ursset
- Demo video: TODO: video URL
- Presentation deck: TODO: deck URL
- Explorer: https://explorer.testnet.chain.robinhood.com
- Contract addresses: TODO: list after the final redeploy (also in README)

## Team
Septian, solo builder (product, smart contracts, frontend).
Bio: TODO: one or two sentences, background and relevant experience.
Contact/social: TODO: link (optional).

## How to judge it in 3 minutes
1. Open https://ursset.vercel.app, pick a property, and tap through the three steps (sign in with any email, top up test Rupiah, Urunan). Units appear in your portfolio.
2. In Portfolio, open "Lihat bukti di blockchain" on any transaction to see it on the explorer, and look at the rent history on the property page. Try sending units to a wallet that is not verified: the contract rejects it.
3. In the repo, read `packages/foundry/contracts/PropertyToken.sol` (the `_update` hook enforces KYC on every transfer) and run `cd packages/foundry && forge test` (26 tests: KYC, sale and rooms, pro rata rent, marketplace, factory). `packages/nextjs/scripts/e2e.mjs` runs the full flow against the testnet.
4. The owner area (`/operator`, protected by an operator code) lists a property and deposits rent. Code available on request from the team: TODO: confirm how judges get access, or rely on the demo video.
