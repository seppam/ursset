# URSSET: HackQuest submission text

Ethereum Jakarta Hackathon 2026, theme: Real-World Assets. Deadline: Sat 10 Oct 2026, 12:00 WIB. Paste each block into the matching field.

## Project name
URSSET

## Tagline
Urunan asset: pool money with friends, own part of a rental property, collect rent with publicly checkable deposits.

## Short description (limit assumed 250 characters; this text is 245, recount if HackQuest shows a lower limit)
URSSET lets young Indonesians co-own a boarding house from Rp10,000. Sign in with email, top up, tap once. Rent deposits and payouts are public onchain, and KYC is enforced by the smart contracts. Testnet demo on Robinhood Chain, an Ethereum L2.

## Long description
URSSET ("urunan asset", Indonesian for "pooled asset") is a fractional rental-property app. A property is split into ERC-20 units that start at Rp10,000 each. Investors earn pro rata rent and can resell units to other verified investors.

The user experience hides the blockchain: sign in with email or Google (Privy embedded wallet, no seed phrase, gas covered by the app), top up simulated test Rupiah via QRIS plus a light identity check, then tap "Urunan". Friends can pool through an **Urunan Room**: one shared link and target, each person joins with their own amount, and units land in each person's own wallet, so nobody holds anyone else's money.

What stays verifiable onchain: ownership, every rent deposit and its pro rata split, and resale trades. Rent deposits and their split can be checked; whether the rooms are really rented still depends on the operator/SPV and on audits, which is a risk we acknowledge. Every transaction in the app links to "Lihat bukti di blockchain". Allow-list enforcement is part of the contracts (this is not a claim of regulatory compliance): `PropertyToken` only moves between wallets verified in `KYCRegistry`, so a transfer to an unverified wallet is rejected by the contract itself.

Property owners get an operator area to list a property (name, city, rooms, occupancy, value, photos) in one transaction through `PropertyFactory`, and to deposit monthly rent. The UI is mobile-first and available in Indonesian and English.

Units can be sold to verified investors through the marketplace; liquidity is not guaranteed.

**Disclaimer:** This is a hackathon demo: testnet only, illustrative property data, simulated QRIS and KYC, no real funds. No returns promised, not an investment offer.

## Problem
- Property needs large capital, so most young Indonesians are locked out.
- On fractional platforms, investors usually have to trust the operator's rent reports and cannot check them independently.
- Crypto-based products ask ordinary people to manage wallets, gas and seed phrases.

## Solution
A three-step flow (sign in, top up, Urunan) that gives a user units of a rental property, with the facts that matter (ownership, rent deposits, payouts, trades) recorded on a public ledger the operator does not control. KYC rules are enforced by the token contract. Groups can buy together through an Urunan Room without anyone custodying others' money.

Why onchain: Ownership, rent payouts and trades between investors happen on a public ledger the operator does not control, so investors can verify for themselves without trusting a database, while KYC rules are enforced directly by the smart contract.

## RWA use case
Rental real estate (boarding houses, "kos") in Indonesia. Units represent economic rights to rent from a property. In production the property would be held by a legal-entity SPV and investors would hold rights to rent, not the land certificate; the token stores a hash of the legal documents. Seed properties in the demo (Kos Melati Depok, Kos Dago Asri Bandung) are illustrative.

Further notes, not settled: rent is likely subject to income tax and/or VAT; the legal standing of rent rights held in an SPV needs a clear legal structure; crypto-asset oversight in Indonesia has moved to OJK, so the rules may change. We have no legal or tax advice yet.

Regulatory stance. Limit: tokens representing rights to property rent may be treated as financial products supervised by OJK, and payments in Indonesia must be in Rupiah. Path: we pursue the OJK Regulatory Sandbox, like earlier property tokenization precedents, with the property held by a legal-entity SPV and Rupiah in and out through a BI-licensed payment provider. Now: for the hackathon, testnet, non-custodial, illustrative property data, no real user funds.

## Business model (assumption, not validated, not implemented in the contracts)
Listing fee from the property owner, about 3% of funds raised. Illustration only: Rp500 million raised would mean Rp15 million per listing, paid once. Investors pay no platform fee. Recurring revenue (secondary-market fees, rent management) is a later phase. We have no revenue and have not validated the 3% with owners.

## Competitive context
GORO is an Indonesian fractional-property platform that shows demand for owning property from small amounts with rent and resale, and we respect that work. We have not verified the details of its regulatory status (we have seen it described as an OJK Regulatory Sandbox graduate in Nov 2025, but we have no source to cite), so we make no claim about it. What URSSET tries differently, as a hackathon prototype and not a finished competitor: the group Urunan Room (one link, each friend's units in their own wallet), KYC checked by the token contract on every transfer, rent deposits and splits that anyone can check onchain, and a wallet-free, gas-free experience for the user.

## Tech stack
- Contracts: Solidity, Foundry, OpenZeppelin 5.x. Seven contract types (each listed property creates four contracts: token, sale, rent distributor, marketplace): `KYCRegistry`, `PropertyToken`, `RentDistributor`, `PrimarySale` (with rooms), `Marketplace`, `PropertyFactory`, `MockIDR`.
- Chain: Robinhood Chain Testnet (Ethereum L2 for tokenized assets), chain ID 46630.
- Frontend: Next.js, React, wagmi, viem, TanStack Query, Tailwind CSS; Privy for email/Google login and embedded wallets; Vercel (hosting and Blob for photos).
- Tests: 45 Foundry tests (including invariant and fuzz tests) plus an end-to-end script (`packages/nextjs/scripts/e2e.mjs`) that runs onboarding, Urunan Room, rent, resale and KYC rejection on the testnet.
- Scaffold: Scaffold-ETH 2.

## Built during the hackathon vs reused
Written during the hackathon: everything in `packages/foundry/contracts`, `packages/foundry/test`, `packages/foundry/script/Deploy.s.sol`, `packages/foundry/scripts-js/exportUrsset.mjs`, and `packages/nextjs` (pages, components, API routes, hooks).

Reused, with attribution: Scaffold-ETH 2 (project scaffold, Foundry setup, ABI generation tooling; example UI removed), OpenZeppelin Contracts 5.x (ERC-20, Ownable, SafeERC20), Foundry and forge-std, Privy (login, embedded wallets, token verification), and standard web libraries (Next.js, React, wagmi, viem, TanStack Query, Tailwind CSS, qrcode.react).

## Honest limits
Contracts were redeployed during the build; the history (including why) is in `docs/DEPLOYMENTS.md`. Testnet only. QRIS and KYC are simulations. `MockIDR` skips approvals as a test-token shortcut. One operator key verifies and can un-verify wallets, mints test Rupiah and deposits rent; rent is split by a snapshot at deposit time, so someone could buy right before a deposit and sell right after (no contract-level mitigation yet); in production this becomes a licensed KYC provider and the SPV's bank rent via a licensed payment provider.

## Links
- Live app: https://ursset.vercel.app
- GitHub: https://github.com/seppam/ursset
- Demo video: TODO: video URL
- Presentation deck: TODO: deck URL
- Explorer: https://explorer.testnet.chain.robinhood.com
- Contract addresses (Robinhood Chain Testnet, chain ID 46630; full list with explorer links in the README): KYCRegistry `0x7229df70dbc6abba77cb8ce24b175079982f0acf`, MockIDR `0x7668c1978f5e3bb10bff606b3c2d081e0e1a7282`, PropertyFactory `0x5f0c4e0b03127ea3f251d7bf87d29be29f07c5f6`

## Team
Septian, solo builder (product, smart contracts, frontend).
Bio: TODO: one or two sentences, background and relevant experience.
Contact/social: TODO: link (optional).

## How to judge it in 3 minutes
1. Open https://ursset.vercel.app, pick a property, and tap through the three steps (sign in with any email, top up test Rupiah, Urunan). Units appear in your portfolio.
2. In Portfolio, open "Lihat bukti di blockchain" on any transaction to see it on the explorer, and look at the rent history on the property page. Try sending units to a wallet that is not verified: the contract rejects it.
3. In the repo, read `packages/foundry/contracts/PropertyToken.sol` (the `_update` hook enforces the allow-list on every transfer) and run `cd packages/foundry && forge test` (45 tests: KYC, invariants and fuzz, sale and rooms, pro rata rent, marketplace, factory). `packages/nextjs/scripts/e2e.mjs` runs the full flow against the testnet.
4. The owner area (`/operator`, protected by an operator code) lists a property and deposits rent.

## How judges access the owner area
The operator code is given through a private channel (HackQuest private message or direct message), never written in the repo or in this text. TODO: confirm the channel and send the code to the judges when they ask, or rely on the demo video.
