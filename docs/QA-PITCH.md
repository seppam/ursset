# URSSET: 18 hardest judge questions

Disclaimer for every answer: testnet demo, illustrative data, no returns promised, not an investment offer. (ID: demo testnet, data ilustrasi, tidak ada imbal hasil yang dijanjikan, bukan penawaran investasi.)

Rule: answer in two sentences, say what is built vs planned, never claim returns or full compliance. Where we do not know, say so. Each answer is English first, with a one-line Indonesian version (ID) below.

## 1. How is this different from GORO?
GORO is an established Indonesian fractional-property platform and shows there is demand for this model; we respect that work and do not claim to be bigger or more compliant. We have not verified the details of its regulatory status, so we make no claim about it. What we try differently is: the group Urunan Room (one link, each friend's units in their own wallet), KYC checked by the token contract on every transfer rather than only in the app, rent deposits and splits anyone can check onchain, and a wallet-free, gas-free experience. These are prototype features on a testnet, not a finished competitor.

ID: GORO sudah ada dan menunjukkan ada permintaan; kami menghargainya dan belum memverifikasi detail status regulasinya. Kami mencoba Urunan Room, KYC di kontrak, setoran sewa yang bisa diperiksa onchain, dan UX tanpa wallet/gas, sebagai prototipe testnet.

## 2. Is this legal?
Not yet for real money, and we say so. Tokens representing rights to property rent may be treated as financial products supervised by OJK, and payments in Indonesia must be in Rupiah. We pursue the OJK Regulatory Sandbox, like earlier property tokenization precedents, with the property held by a legal-entity SPV and Rupiah in and out through a BI-licensed payment provider. For the hackathon: testnet, non-custodial, illustrative property data, no real user funds.

ID: Belum untuk uang sungguhan; jalannya Sandbox OJK dengan SPV dan penyedia pembayaran berlisensi BI, sekarang hanya testnet tanpa dana nyata.

## 3. Why does this need a blockchain? A database could do it.
A database works if you trust the operator. Ownership, rent payouts and trades between investors happen on a public ledger the operator does not control, so investors can verify for themselves without trusting a database, while KYC rules are enforced directly by the smart contract. Honest limit: the operator still deposits the rent, so the chain proves what was deposited and how it was split, not that the rooms were really rented or that the owner collected the right amount.

ID: Kepemilikan, setoran sewa, dan transaksi ada di buku besar publik yang tidak dikendalikan operator; batasnya, operator tetap yang menyetor sewa, jadi rantai membuktikan setoran dan pembagiannya, bukan kebenaran penyewaan.

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
Listing fee from the property owner, about 3% of funds raised, because owners need capital for renovation or more rooms without bank collateral. For illustration, Rp500 million raised would mean Rp15 million per listing, paid once. The 3% is an unvalidated assumption, it is not implemented in the contracts, and we have no revenue; investors pay no platform fee, and recurring revenue (secondary-market fees, rent management) is a later phase.

ID: Biaya listing dari pemilik sekitar 3% dari dana terkumpul (asumsi belum divalidasi, belum ada di kontrak); contoh ilustrasi Rp500 juta menjadi Rp15 juta sekali bayar. Pendapatan berulang adalah fase berikutnya; belum ada pendapatan.

## 12. What happens next?
Pilot with one real boarding house (first step in the first week after the hackathon: ask 10 owners), apply to the OJK Regulatory Sandbox, integrate a licensed payment partner and KYC provider, replace the single operator key with proper role separation, add secondary-market fees and multiple properties. We would use regulatory mentors and introductions to boarding-house owners. TODO: add dates or commitments only if they exist.

ID: Pilot satu kos nyata, Sandbox OJK, mitra pembayaran dan KYC berlisensi, pemisahan peran operator; kami butuh mentor regulasi dan pemilik kos.

## 13. Who guarantees the rent is real?
Nobody in the contracts. The chain shows that a rent deposit happened and how it was split, but whether the rooms were actually rented depends on the operator or SPV and on audits, and that is a risk we acknowledge. The planned mitigation is off-chain (SPV bank account flow through a licensed provider, independent audit of rent records), and none of it is built.

ID: Tidak ada jaminan di kontrak. Rantai menunjukkan setoran dan pembagiannya; kebenaran penyewaan bergantung pada operator/SPV dan audit, itu risiko yang kami akui, dan mitigasinya belum dibangun.

## 14. Can someone buy units just before a rent deposit and sell right after?
Yes. Rent is split by a snapshot at deposit time, so this "buy before deposit, sell after" pattern works, and the contracts have no mitigation for it yet. The operator can reduce it by depositing without announcing the timing, but that is a workaround, not a fix. A real design would need rent periods or a holding requirement.

ID: Bisa. Pembagian memakai snapshot saat setor, dan kontrak belum punya mitigasi; operator hanya bisa mengurangi dengan setor tanpa pengumuman.

## 15. One operator key can un-verify wallets. Isn't that a single point of failure?
Yes. In the demo one key verifies and un-verifies wallets, mints test Rupiah and deposits rent, so if it is lost or abused, users can be frozen (their already earned rent stays claimable). Production needs role separation, a multisig or timelock, a licensed KYC provider and a recovery policy; none of that is built yet.

ID: Ya. Satu kunci bisa verify dan un-verify dompet; produksi butuh pemisahan peran, multisig, penyedia KYC berlisensi dan kebijakan pemulihan, belum dibangun.

## 16. What exactly is the token legally?
In the demo, an ERC-20 with an allow-list and no legal meaning. In the plan, it would represent economic rights to rent held through an SPV, with a hash of the legal documents stored in the token. Whether that is a security, a collective investment product or something else under OJK rules is not settled and we have no legal opinion yet; rent income tax or VAT is also open.

ID: Di demo, token ERC-20 tanpa makna hukum. Rencananya hak ekonomi atas sewa lewat SPV; statusnya di bawah aturan OJK, serta PPh/PPN atas sewa, belum dipastikan dan belum ada pendapat hukum.

## 17. Who is the first real user?
We do not have one, and we did not interview anyone. The plan for the first week after the hackathon is to ask 10 boarding-house owners whether they would raise money this way, what they would pay, and what stops them. We will report what we hear, whatever it is.

ID: Belum ada, dan kami tidak melakukan wawancara. Rencana minggu pertama pasca-hackathon: tanya 10 pemilik kos apakah mau, berapa mau bayar, dan apa hambatannya.

## 18. Are you promising returns? Is this an investment offer?
No. No returns are promised and this is not an investment offer. It is a testnet demo with test Rupiah and illustrative property data.

ID: Tidak. Tidak ada imbal hasil yang dijanjikan dan ini bukan penawaran investasi; ini demo testnet dengan Rupiah uji dan data ilustrasi.

---

## Questions to avoid answering with numbers
Market size, expected yield, user counts, investor demand. If asked: "We have no real users yet; the demo is on testnet."

ID: Kami belum punya pengguna nyata; demo ada di testnet.

## Can a property owner buy their own units?

**EN:** Technically yes: any verified wallet can buy units, including the owner's, because the contracts only check KYC and payment, not who the buyer is. In the business model that is acceptable and even healthy when it is disclosed, because it is the owner keeping "skin in the game" in their own property. The risk is wash buying that inflates the funding progress bar. Our planned safeguards (not built in the hackathon): show the owner's holding on the property page, cap the owner's share of the raise, lock owner units for a period, and count only third-party funds toward a funding target. The listing fee is charged on funds raised from third parties.

**ID:** Secara teknis bisa: wallet terverifikasi mana pun boleh membeli unit, termasuk pemiliknya, karena kontrak hanya memeriksa KYC dan pembayaran. Untuk model bisnis, itu wajar dan justru sehat bila diungkapkan, karena pemilik ikut menanggung risiko (skin in the game). Risikonya adalah pembelian semu yang menggelembungkan progres pendanaan. Pengaman yang direncanakan (belum dibangun di hackathon): tampilkan kepemilikan pemilik di halaman properti, batasi porsi pemilik, kunci unit pemilik untuk jangka waktu tertentu, dan hitung hanya dana pihak ketiga untuk target pendanaan. Biaya listing dihitung dari dana yang terkumpul dari pihak ketiga.
