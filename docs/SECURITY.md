# URSSET security review

Status: pre-submission review of the testnet demo. The review itself changed no contract. Afterwards the owner applied two of the cheap proposals before the final deploy:

- **F-04 fixed:** `PropertyFactory` no longer marks the `RentDistributor` a trusted spender. The operator approves the distributor like any ERC-20 spender (the server does this once per property).
- **F-10 partly fixed:** `setRegistrar`, `setTrustedSpender` and `setDistributor` now emit events. `Ownable2Step` was not adopted: ownership hand-offs happen inside the factory in one transaction and a two-step flow would break that.

All other findings below remain open and are documented as known limitations of the testnet demo.

## Scope and method

| Item | Detail |
| --- | --- |
| Contracts | `KYCRegistry`, `MockIDR`, `PropertyToken`, `RentDistributor`, `PrimarySale`, `Marketplace`, `PropertyFactory` (`packages/foundry/contracts/`) |
| Out of scope | Frontend, deploy scripts, offchain KYC, OpenZeppelin 5.x internals |
| Method | Manual read of all 7 contracts and the 26 existing tests, threat modelling (access control, reentrancy and ordering, rounding, KYC revocation, marketplace staleness, DoS), then executable evidence |
| Evidence | `packages/foundry/test/Invariants.t.sol`: 5 stateful invariants (256 runs, depth 50), 3 fuzz tests, 15 unit tests. Findings that could be demonstrated are pinned by `test_KnownIssue_*` tests that pass on the current code |
| Result | 45 tests pass (26 existing, 19 new). No loss of user funds or units was found that a non-operator can cause |
| Not done | No formal verification, no mainnet fork, no review of the deployed addresses, no gas profiling, no review of non-standard ERC-20 behaviour (the contracts only ever use `MockIDR` and `PropertyToken`) |

## Trust assumptions

| Actor | Can | Cannot |
| --- | --- | --- |
| Operator (owner of `KYCRegistry`, `MockIDR`, `PropertyFactory`, and per property `PropertyToken` and `RentDistributor`) | Verify or un-verify any wallet; mint unlimited tIDR; mark any address a trusted spender (spend any tIDR balance without approval, F-03); create properties; deposit rent; choose the treasury per property | Mint more units after `mintInventory`; re-set the distributor; change the sale price; withdraw unsold inventory; move anyone's units (units can only move by their holder or by an approved spender, and only between verified wallets) |
| Registrar (the factory, in `KYCRegistry` and `MockIDR`) | Same as the operator for `setVerified` and `setTrustedSpender`, but the factory exposes no function that uses this beyond `createProperty` | Be called by anyone but its owner |
| Verified holder | Transfer units to any other verified wallet (including zero-value), list, claim | Send units to unverified wallets, claim another wallet's rent |
| Unverified wallet | Call `createRoom`; claim rent it already earned | Receive units |

Test-only by design: `MockIDR` (free minting, trusted spender shortcut), the single-key operator, and the "KYC" flag (a boolean set by the operator, no real identity check).

## Findings

All statuses are "not changed". "Verified" means shown by a passing test or by reading the code path.

| ID | Sev | Where | Description | Impact | Proposed fix | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | Low | `RentDistributor._settle`, `PropertyToken._update` | `_settle` stores `paid = accPerUnit` after flooring `balance * delta / 1e18`, so the fractional part is lost each time a holder is settled. `transfer(victim, 0)` by any verified wallet settles the victim for free. With small deposits relative to supply (for example 10 tIDR over 110 units) a small holder who is settled after each deposit accrues 0 forever, while an identical un-settled holder accrues 18 | User-exploitable griefing, loss is under 1 tIDR per grief and only for small holders; also occurs naturally when holders transfer often | Track remainders: keep `accrued` in 1e18 precision and divide only on `claim`, i.e. `accruedScaled[h] += balance * (acc - paid[h])` and `amount = accruedScaled[h] / 1e18` | Verified: `test_KnownIssue_ZeroTransferGriefsSmallHolderRent` |
| F-02 | Medium (prod) / Info (demo) | `KYCRegistry.setVerified`, `PropertyToken._update`, `RentDistributor.claim` | Un-verifying a holder freezes the units: they cannot be sent anywhere, not even back to the sale, and there is no operator recovery or forced transfer. Rent still accrues to the frozen units and the wallet can still claim it (claim has no KYC check). Lost keys are unrecoverable too | A revoked investor is locked in; operator can only re-verify. Not exploitable by users | Decide the policy and document it. Options: add `forceTransfer(from, to, amount)` owner-only with an event, or block `claim` for unverified wallets | Verified: `test_KnownIssue_RevokedHolderKeepsRentButUnitsAreFrozen` |
| F-03 | Medium (operator only) | `MockIDR.setTrustedSpender`, `allowance`, `_spendAllowance` | The owner or any registrar can mark any address a trusted spender, which then calls `transferFrom(anyHolder, ...)` with no approval. `allowance()` also reports `max` for every holder, which misleads wallets and indexers | The operator can drain every tIDR balance. Test tokens only, but a judge may read it as a backdoor | Test token only: say so (see limitations). If kept on a public demo: restrict trusted spenders to a list frozen after deployment, or replace with `permit` / one-time max approval in the frontend | Verified: `test_KnownIssue_TrustedSpenderCanDrainAnyHolder` |
| F-04 | Low | `PropertyFactory.createProperty` | The factory also marks the `RentDistributor` a trusted spender, but the distributor only pulls from its owner in `depositRent` (the operator, who can simply approve). Extra privilege with no use | Larger blast radius if the distributor were ever exploited | Delete `idr.setTrustedSpender(address(distributor), true)` | Verified: `test_KnownIssue_DistributorIsTrustedSpenderUnnecessarily` |
| F-05 | Low | `RentDistributor.depositRent` | Rent is a snapshot of balances at the deposit transaction. A verified wallet can buy units on the marketplace just before a deposit and sell them just after, taking a full period of rent for the spread (example test: sniper earns 1000 of 2000 while the long-term holder earns 0). The operator cannot prevent it | Economic unfairness for long-term holders. Needs a willing seller, so impact grows with marketplace liquidity | Operational: send `depositRent` privately or from a script that also pauses listings. Contract: accrue by time-weighted balance, or add a minimum holding period before rent accrues | Verified: `test_KnownIssue_RentSnipingRoundTrip` |
| F-06 | Info | `Marketplace.list`, `Marketplace.buy` | Listings are validated only at creation. A seller can list more units than they own across several listings, list without approval, or move units away. Fills then revert (`InsufficientUnits` or an allowance error). Price and units are immutable per listing, so a buyer cannot be switched to a worse price, and a failed fill costs only gas. Revoked sellers' listings remain visible | UI shows unfillable listings | Frontend: filter by `balanceOf` and `allowance` before display. Optional contract: `buy` already re-checks balance, nothing to fix onchain | Verified: `test_KnownIssue_StaleAndOverlappingListings` |
| F-07 | Info | `PrimarySale.createRoom`, `buy` | Rooms are counters. Anyone (even unverified) can create a room, there is no cap, deadline, refund or recipient, and `raisedUnits` can exceed `targetUnits`. Titles are unbounded strings. Nobody holds money for a room | Metrics can be gamed or spammed; the UI must render titles as plain text | Frontend: escape titles; optionally cap title length and reject buys beyond target | Verified: `test_KnownIssue_RoomsAreCountersOnly`, invariant `RoomAccounting` |
| F-08 | Info | `PropertyToken._update` | A verified wallet can push units onto any other verified wallet without consent (also zero-value). This is the vector for F-01 | Unsolicited holdings; negligible | None required, or require opt-in | Verified: `test_KnownIssue_UnsolicitedTransfersAreAllowed` |
| F-09 | Info | `RentDistributor` | Rounding dust stays in the contract and tIDR sent straight to it is unrecoverable; there is no sweep. Dust per deposit is under 1 tIDR plus under 1 per settle | Negligible loss | Optional `sweepDust()` owner-only limited to `balance - (totalDeposited - totalClaimed)` | Verified: `test_KnownIssue_DistributorHasNoSweep`, invariant `RentNeverExceedsDeposits` |
| F-10 | Info | `PropertyFactory`, `KYCRegistry`, `MockIDR` | The factory keeps the registrar role forever; it has no function that abuses it, but it must stay owner-gated. Ownership is single-step `Ownable` and one key controls everything (KYC, tIDR, rent, factory). `setRegistrar`, `setTrustedSpender`, `setDistributor` emit no events | Key loss or a typo in `transferOwnership` is permanent; role changes are not auditable offchain | Use `Ownable2Step`, a multisig, and add events to the three setters | Verified by reading; `test_FactoryLeavesNoPrivilegedKeysBehind` |
| F-11 | Info | `PrimarySale.buy`, `Marketplace.buy` | Units are transferred before payment is pulled. With a hookless ERC-20 (`MockIDR`) there is no reentrancy and a failed payment reverts the whole call. State (`active = false`, room counters) is written before external calls. If `payToken` were ever an ERC-777 or hook token this ordering should be revisited | None today | Optional: pull payment first, then transfer units, and add `nonReentrant` | Verified by reading |
| F-12 | Info | `PropertyFactory.createProperty` | `treasury` may be any address (including an unrelated contract); strings are stored unbounded and unvalidated; `unitPrice * units` overflow only reverts the buy. Owner-only, so no user risk | Operator misconfiguration only | Reject `treasury == address(token)`/`sale`; cap string length | Verified by reading |
| F-13 | Info | `PrimarySale` | Units sent back to the sale are resold at the fixed price and stop earning rent while there (inventory exclusion). The sale never pays holders for returned units, so returning units is a donation | None unless users misuse it | Frontend should not offer "return to sale" | Verified: `test_UnitsReturnedToSaleStopEarningRent` |
| U-01 | Unverified | `RentDistributor.depositRent` | Very large deposits: `amount * 1e18` overflows above about 1.1e59 tIDR, far beyond any realistic supply. Not tested | None realistic | none | Unverified, reasoning only |

Checked and found sound: `settle` ordering (settle `from` and `to` before balances change, inventory and mint/burn skipped, so a buyer never earns rent from before they held units and a seller never loses accrued rent); holders cannot claim more than deposited; the accumulator is safe with a circulating supply of 1; `claim` follows checks-effects-interactions; no unverified address, nor the marketplace, distributor or factory, can ever hold units; room accounting adds up; one-shot setters (`mintInventory`, `setDistributor`, `setup`) cannot be repeated; `settle` is callable only by the token; ownership of token and distributor ends up with the operator and not the factory.

## Invariants tested

| Invariant | Test | Outcome |
| --- | --- | --- |
| Owed (all holders) plus claimed never exceeds deposited; distributor balance equals deposited minus claimed; owed never exceeds the balance; unsold inventory earns 0; dust (`deposited - claimed - owed`) is at most one token per settle or deposit | `invariant_RentNeverExceedsDeposits` | Pass |
| Sum of balances over all wallets and contracts equals total supply, which equals `totalUnits` | `invariant_BalancesSumToSupply` | Pass |
| Units sit only in the sale contract or in wallets verified at receipt time (a currently unverified holder must have been revoked after receiving); marketplace, distributor, token, KYC, factory, tIDR and stranger hold none | `invariant_UnitsOnlyInVerifiedHands` | Pass |
| `unitsLeft` plus units held by buyers equals total supply | `invariant_SaleInventoryPlusHoldersEqualsSupply` | Pass |
| Room `raisedUnits` and `contributors` equal the sum over wallets | `invariant_RoomAccounting` | Pass |
| A stranger can never receive units (direct, via `transferFrom`, or via the marketplace) | `testFuzz_StrangerCanNeverReceiveUnits`, invariant (c) | Pass |
| Two-holder rent split never overpays and loses at most 2 tIDR | `testFuzz_RentSplitNeverOverpays`, `testFuzz_ClaimEverythingLeavesOnlyDust` | Pass |

The handler randomly buys, creates rooms, transfers to wallets and contracts (including zero-value), lists, fills, cancels, deposits rent, claims, and verifies or revokes wallets. All runs use the real `PropertyFactory` wiring. Limits of the harness: one property, four actors, small supply (1000 units), reverts are swallowed so sequences that always revert are not flagged.

## Known limitations (testnet demo)

Quote these in the README:

1. Everything runs on a testnet with test tokens. tIDR is minted freely by the operator and has no value.
2. "KYC" is a boolean flag set by the operator. No identity data is checked or stored onchain, and the operator can verify or un-verify any wallet at any time.
3. One operator key controls verification, tIDR minting, property creation and rent deposits. There is no multisig, timelock or two-step ownership transfer.
4. tIDR has a trusted-spender shortcut: contracts the operator marks as trusted can spend any holder's tIDR without approval. This exists only to save a click on the test token and would not exist with a real stablecoin.
5. Un-verifying a holder freezes their units and there is no recovery or forced transfer. They can still claim rent already accrued.
6. Rent is distributed by balance at the moment of deposit; short-term holders around a deposit can capture rent. Rounding dust below 1 tIDR per settlement is not tracked, and small holders can be rounded to zero by zero-value transfers.
7. The marketplace is non-custodial and fixed price. Listings are not re-validated until filled, so the UI may show listings that cannot be filled.
8. Urunan Rooms are counters only: no escrow, target enforcement or refund.
9. Unit price in the primary sale is fixed; unsold inventory cannot be withdrawn.
10. The contracts have been reviewed internally and tested with invariant and fuzz tests, but have not had an external audit. The legal structure of the underlying property is out of scope.
