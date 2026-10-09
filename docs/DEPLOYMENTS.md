# Deployment history (Robinhood Chain Testnet, 46630)

Old deployments stay on chain and are listed here on purpose, so the history is visible, including mistakes.

## v2 (current)
See the table in `README.md` and `packages/nextjs/lib/generated/ursset.ts`. Deployed 9 Oct 2026 (evening) after v1 below.

## v1 (superseded, 9 Oct 2026)
Shared contracts:

| Contract | Address |
| --- | --- |
| KYCRegistry | [`0x7229df70dbc6abba77cb8ce24b175079982f0acf`](https://explorer.testnet.chain.robinhood.com/address/0x7229df70dbc6abba77cb8ce24b175079982f0acf) |
| MockIDR (tIDR) | [`0x7668c1978f5e3bb10bff606b3c2d081e0e1a7282`](https://explorer.testnet.chain.robinhood.com/address/0x7668c1978f5e3bb10bff606b3c2d081e0e1a7282) |
| PropertyFactory | [`0x5f0c4e0b03127ea3f251d7bf87d29be29f07c5f6`](https://explorer.testnet.chain.robinhood.com/address/0x5f0c4e0b03127ea3f251d7bf87d29be29f07c5f6) |

Per-property addresses: call `PropertyFactory.properties(id)` on the factory above. Kos Dago Asri Bandung's RentDistributor was `0x3D9C2760471337E4e40C6068580476DCC9035dE6`.

Why it was replaced: while recording the demo, a rent deposit was entered with a mistyped per-unit amount (Rp100,500 per unit, Rp3,417,000 total for 34 units worth Rp340,000), which reads like a 1000% yield and is not a realistic demo. On-chain records cannot be edited, so the deployment was replaced rather than hidden. Lesson: the app now rejects rent deposits above a sanity cap per unit (see `docs/SECURITY.md`).
