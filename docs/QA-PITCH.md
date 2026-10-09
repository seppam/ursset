# URSSET: 12 hardest judge questions

Rule: answer in two sentences, say what is built vs planned, never claim returns or full compliance. Where we do not know, say so. Each answer is English first, with a one-line Indonesian version (ID) below.

## 1. How is this different from GORO?
GORO proved that fractional property from Rp10,000 with monthly rent and resale works in Indonesia, and it graduated the OJK Regulatory Sandbox in Nov 2025. We are not claiming to be bigger. We add four things: a group Urunan Room (one link, everyone's units in their own wallet), rent deposits and payouts anyone can verify onchain, KYC enforced by the smart contract, and no wallet or gas for the user.

ID: GORO sudah membuktikan model ini dan lulus Sandbox OJK; kami menambah Urunan Room, sewa yang bisa diverifikasi onchain, KYC oleh kontrak, dan tanpa wallet/gas.

## 2. Is this legal?
Not yet for real money, and we say so. Tokens representing rights to property rent may be treated as financial products supervised by OJK, and payments in Indonesia must be in Rupiah. We pursue the OJK Regulatory Sandbox, like earlier property tokenization precedents, with the property held by a legal-entity SPV and Rupiah in and out through a BI-licensed payment provider. For the hackathon: testnet, non-custodial, illustrative property data, no real user funds.

ID: Belum untuk uang sungguhan; jalannya Sandbox OJK dengan SPV dan penyedia pembayaran berlisensi BI, sekarang hanya testnet tanpa dana nyata.

## 3. Why does this need a blockchain? A database could do it.
A database works if you trust the operator. Ownership, rent payouts and trades between investors happen on a public ledger the operator does not control, so investors can verify for themselves without trusting a database, while KYC rules are enforced directly by the smart contract. Honest limit: the operator still deposits the rent, so the chain proves what was deposited, not that the owner collected the right amount.

ID: Kepemilikan, sewa, dan transaksi ada di buku besar publik yang tidak dikendalikan operator; batasnya, operator tetap yang menyetor sewa.

## 4. Who actually holds the property?
In production, a legal-entity SPV (PT) holds the property. Investors hold economic rights to rent represented by the token, not the land certificate, and the token stores a hash of the legal documents. In the demo, no real property is involved; the data is illustrative.

ID: Di produksi, SPV (PT) memegang properti; investor memegang hak ekonomi atas sewa, bukan sertifikat tanahnya. Demo memakai data ilustrasi.

## 5. What if the owner stops paying rent?
Then there is nothing to distribute, and the contract cannot force a payment. The protection is off-chain: SPV structure, owner contracts, and a payment flow from the SPV's bank account through a licensed provider, plus a public record that makes a missed deposit visible immediately. We have not built enforcement against owners yet; that is part of the pilot design.

ID: Kontrak tidak bisa memaksa pemilik; perlindungannya di luar rantai (SPV, kontrak pemilik), dan setoran yang terlewat langsung terlihat publik.

## 6. Where is the liquidity? Who buys my units?
Resale is a non-custodial fixed-price marketplace between verified investors, and the seller keeps earning rent while listed. It is built and tested, but liquidity depends on investor count, which we do not have yet. We do not promise instant exit.

ID: Pasar jual-beli non-kustodian sudah ada dan diuji, tetapi likuiditas bergantung jumlah investor yang belum kami punya; kami tidak menjanjikan bisa langsung jual.

## 7. How is the token price set?
Primary sale is fixed price at Rp10,000 per unit, matching the common minimum in this market. Listed values are illustrative in the demo. In production the SPV's valuation and legal documents set the basis. Resale prices are set by sellers; we do not guarantee value.

ID: Harga jual perdana tetap Rp10.000 per unit; nilai di demo ilustrasi, harga jual ulang ditentukan penjual, tanpa jaminan nilai.

## 8. Does rent distribution scale to many holders?
`RentDistributor` uses a pro rata accumulator, so a deposit costs the same no matter how many holders there are; each holder settles when they claim or when units move. Unsold inventory earns no rent, late buyers get no past rent, and rent follows units after a transfer (all tested). We have tested the logic, not thousands of holders on testnet.

ID: Akumulator pro rata membuat biaya setoran tetap sama berapa pun jumlah pemegang; logikanya sudah diuji, tetapi belum diuji dengan ribuan pemegang.

## 9. What about KYC privacy?
The registry stores only an address and a verified boolean, never personal data. In the demo the identity check is a flag and no personal data is collected. In production, a licensed KYC provider would hold the data off-chain and set the flag. A public allow-list still reveals which addresses are verified; we accept that tradeoff for now.

ID: Registri hanya menyimpan alamat dan status terverifikasi, bukan data pribadi; di produksi data dipegang penyedia KYC berlisensi di luar rantai.

## 10. Why Robinhood Chain?
It is an Ethereum L2 built for tokenized assets, which fits the RWA theme, and it is EVM-compatible so the contracts are standard Solidity. It is a testnet today. Honest note: some Indonesian ISPs block the RPC domain, so the app provides an `/api/rpc` proxy. The contracts are portable to any EVM chain.

ID: L2 Ethereum untuk aset tertokenisasi dan kompatibel EVM; saat ini testnet, kontrak bisa dipindah ke chain EVM lain.

## 11. How do you make money?
Listing fee from the property owner, about 3% of funds raised, because owners need capital for renovation or more rooms without bank collateral. Investors pay no platform fee; a secondary-market fee is a later phase. The 3% is an assumption we still have to validate with owners, and we have no revenue.

ID: Biaya listing dari pemilik sekitar 3% dari dana terkumpul (asumsi), investor tanpa biaya platform; belum ada pendapatan.

## 12. What happens next?
Pilot with one real boarding house, apply to the OJK Regulatory Sandbox, integrate a licensed payment partner and KYC provider, replace the single operator key with proper role separation, add secondary-market fees and multiple properties. We would use regulatory mentors and introductions to boarding-house owners. TODO: add dates or commitments only if they exist.

ID: Pilot satu kos nyata, Sandbox OJK, mitra pembayaran dan KYC berlisensi, pemisahan peran operator; kami butuh mentor regulasi dan pemilik kos.

---

## Questions to avoid answering with numbers
Market size, expected yield, user counts, investor demand. If asked: "We have no real users yet; the demo is on testnet. TODO: replace with interview/waitlist figures if collected."

ID: Kami belum punya pengguna nyata; demo ada di testnet.

## Can a property owner buy their own units?

**EN:** Technically yes: any verified wallet can buy units, including the owner's, because the contracts only check KYC and payment, not who the buyer is. In the business model that is acceptable and even healthy when it is disclosed, because it is the owner keeping "skin in the game" in their own property. The risk is wash buying that inflates the funding progress bar. Our planned safeguards (not built in the hackathon): show the owner's holding on the property page, cap the owner's share of the raise, lock owner units for a period, and count only third-party funds toward a funding target. The listing fee is charged on funds raised from third parties.

**ID:** Secara teknis bisa: wallet terverifikasi mana pun boleh membeli unit, termasuk pemiliknya, karena kontrak hanya memeriksa KYC dan pembayaran. Untuk model bisnis, itu wajar dan justru sehat bila diungkapkan, karena pemilik ikut menanggung risiko (skin in the game). Risikonya adalah pembelian semu yang menggelembungkan progres pendanaan. Pengaman yang direncanakan (belum dibangun di hackathon): tampilkan kepemilikan pemilik di halaman properti, batasi porsi pemilik, kunci unit pemilik untuk jangka waktu tertentu, dan hitung hanya dana pihak ketiga untuk target pendanaan. Biaya listing dihitung dari dana yang terkumpul dari pihak ketiga.
