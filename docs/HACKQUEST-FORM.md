# HackQuest project form: ready-to-paste values

Fields follow the "Project Archive" edit page. Longer text is in `docs/SUBMISSION.md`; this file only maps it to each field. Deadline: Sat 10 Oct 2026, 12:00 WIB.

| Field | Value |
| --- | --- |
| Name | URSSET |
| Intro (max 200 chars, this is 170) | Pool money with friends to co-own a boarding house from Rp10,000. Sign in with email, tap once, and every rent deposit is public onchain. Testnet demo on Robinhood Chain. |
| Sector | RWA |
| Tech tags (pick up to 8) | Next, Solidity, Web3, Node (add "React" and "Foundry" via Add New if missing) |
| MVP link | https://ursset.vercel.app |
| Project link (GitHub) | https://github.com/seppam/ursset |
| X (Twitter) link | optional, leave empty if there is no account for the project |
| Wallet | connect the wallet that should receive any reward (Robinhood Chain Testnet or the hackathon's network) |
| Images (4, 1280x720) | `~/Documents/URSSET-videos/hackquest/1-persona.png`, `2-solution.png`, `3-demo-frame.png`, `4-why-onchain.png` |
| Demo video | YouTube unlisted link of `demo/ursset-demo-en.mp4` |
| Pitch video | YouTube unlisted link of `pitch/ursset-pitch-en-captioned.mp4` |

## Description
URSSET ("urunan asset", pooled asset) lets young Indonesians co-own part of a rental boarding house from Rp10,000. Sign in with email or Google (an embedded wallet is created, no seed phrase, gas covered), top up simulated test Rupiah, and tap "Urunan". Friends can pool through an Urunan Room: one link, each person joins with their own amount, and units go straight to each person's wallet.

Ownership, every rent deposit and its pro rata split, and resale between investors are recorded onchain, so investors can check them without trusting a database. Token transfers are checked against an allow-list by the smart contract itself, so a transfer to an unverified wallet is rejected by the contract, not by the app. Whether a property is really rented still depends on the operator/SPV and audits, which we state openly.

Owners get an area to list a property in one transaction and to deposit monthly rent (capped per unit by a guardrail). The app is mobile-first, in Indonesian and English.

Hackathon demo only: Robinhood Chain Testnet, illustrative property data, simulated QRIS and KYC, no real funds. No returns promised, not an investment offer.

## Progress During Hackathon
- Seven contract types in Solidity (Foundry, OpenZeppelin): KYC allow-list, test Rupiah, token per property, rent distributor, primary sale with Urunan Rooms, marketplace, and a factory that lists a property in one transaction. 45 passing tests including invariant and fuzz tests.
- Next.js app with Privy login, three-step flow, Urunan Room, portfolio with rent claiming and resale, owner area (list property, deposit rent), profile with onchain history, Indonesian and English.
- Server hardening: one gas drip per account, rate limits, constant-time operator code check, rent-deposit guardrail. Security notes are in `docs/SECURITY.md`; the review was done by AI agents, not a third-party audit.
- End-to-end script that runs onboarding, Urunan Room, rent, resale and the KYC rejection on the testnet.
- Contracts were redeployed once (v2); the old deployment and the reason are documented in `docs/DEPLOYMENTS.md`.
- Built solo, with AI coding assistance (Claude Code) for implementation and review. Remove this line if you prefer to describe it differently.
- Honest gaps: no users, interviews or revenue yet; the 3% listing-fee idea is an unvalidated assumption.

## Fundraising Status
Not fundraising. No funding raised, no token, no investors. Solo builder, self-funded for the hackathon. Next step after the hackathon: ask ten boarding-house owners whether they would sell rent rights at about 3%, then apply to the OJK Regulatory Sandbox with an SPV structure and a licensed payment partner.

## Deployment Details
- Ecosystem deployed: Robinhood Chain (Ethereum L2 for tokenized assets); pick the closest option in the dropdown (for example Ethereum / Arbitrum Orbit family) if it is not listed.
- Testnet / Mainnet: **Testnet** (chain ID 46630)
- Contract addresses and explorer links:
  - KYCRegistry: 0x5146ffc33d970cea588d96ec6b66d7fed74ebc49 https://explorer.testnet.chain.robinhood.com/address/0x5146ffc33d970cea588d96ec6b66d7fed74ebc49
  - MockIDR (tIDR): 0x286db2aef28ddb1928d16075f972edb477851934 https://explorer.testnet.chain.robinhood.com/address/0x286db2aef28ddb1928d16075f972edb477851934
  - PropertyFactory: 0x17130f4e84634f6f6c1bcd0bb3c606b4325b676a https://explorer.testnet.chain.robinhood.com/address/0x17130f4e84634f6f6c1bcd0bb3c606b4325b676a
  - Per-property contracts: see the README table, or call `PropertyFactory.properties(id)`.
  - Live app: https://ursset.vercel.app, code: https://github.com/seppam/ursset

## YouTube upload (unlisted)
- Pitch title: `URSSET: Pitch (Ethereum Jakarta Hackathon 2026, RWA)`
- Demo title: `URSSET: Live demo on Robinhood Chain Testnet`
- Description for both: `URSSET lets people co-own part of a boarding house from Rp10,000 and see every rent deposit onchain. Testnet demo, illustrative data, no returns promised, not an investment offer. App: https://ursset.vercel.app  Code: https://github.com/seppam/ursset  By Muhamad Septian Pamungkas`
- Visibility: Unlisted. Audience: "No, it's not made for kids". Add the `.srt` files as subtitles if you want captions on the demo.
