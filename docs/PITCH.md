# URSSET: Pitch (3 minutes, 7 slides + 1 backup)

Ethereum Jakarta Hackathon 2026, theme Real-World Assets. App: https://ursset.vercel.app | Code: https://github.com/seppam/ursset

Two parallel versions with the same slide numbering: `## Versi Indonesia` (Demo Day, live) and `## English version` (uploaded pitch video, international judges). All claims match the repo. Anything unavailable is marked `TODO:`; never replace a TODO with an invented number.

---

## Versi Indonesia

### Slide 1: Satu kalimat + persona (0:00-0:20)

**Judul:** URSSET: urunan asset

**Di slide**
- 3 langkah, kamu punya aset.
- Urunan bareng teman beli bagian rumah kos, terima sewanya, jual lagi kapan saja.
- Mulai dari Rp10.000 per unit.
- Rina, 24 tahun, karyawan, belum pernah punya properti.

**Visual:** logo URSSET besar, foto kos (properti demo), avatar Rina dengan tiga teman.

**Catatan pembicara (20 dtk):** "Ini Rina, 24 tahun. Dia ingin punya bagian properti, tapi modalnya kecil dan kripto terdengar ribet. URSSET membuat Rina dan tiga temannya urunan membeli bagian rumah kos, mulai Rp10.000, lalu menerima sewa bulanannya. Tiga langkah, tanpa seed phrase."

### Slide 2: Masalah (0:20-0:45)

**Judul:** Properti mahal, dan kita harus percaya laporan operator

**Di slide**
- Properti butuh modal besar, anak muda terkunci di luar.
- Di platform properti pecahan, investor biasanya harus percaya laporan sewa dari operator.
- Produk berbasis kripto meminta orang awam paham wallet, gas, dan seed phrase.
- TODO: hasil wawancara (jumlah responden dan satu kutipan nyata).

**Visual:** tiga ikon hambatan (modal, kepercayaan, kerumitan) dan kotak bertanda TODO untuk kutipan wawancara.

**Catatan (25 dtk):** "Tiga hambatan. Pertama, modal. Kedua, kepercayaan: investor melihat laporan sewa tanpa bisa memeriksanya sendiri. Ketiga, kalau pakai kripto, orang harus mengurus wallet dan biaya gas. [TODO: hasil wawancara bila ada; bila belum, lewati kalimat ini.]"

### Slide 3: Solusi (0:45-1:20)

**Judul:** Tiga langkah, satu link urunan, sewa yang bisa diperiksa

**Di slide**
- 1 Masuk dengan email/Google (dompet otomatis, tanpa seed phrase, gas ditanggung aplikasi).
- 2 Isi saldo Rupiah uji lewat QRIS (simulasi) + cek identitas ringan.
- 3 Urunan sekali tap; unit masuk ke dompetmu.
- Urunan Room: satu link dan target; tiap teman bayar bagiannya, unit ke dompet masing-masing. Tidak ada yang memegang uang orang lain.
- Setiap setoran sewa dan pembagiannya adalah event publik.

**Visual:** tiga layar ponsel (Masuk, Isi saldo, Urunan) dan layar Urunan Room dengan bar progres.

**Catatan (35 dtk):** "Masuk dengan email. Isi saldo lewat QRIS. Tekan Urunan. Itu saja. Kalau mau patungan, buat Urunan Room, bagikan satu link, dan setiap teman masuk dengan jumlahnya sendiri. Unit langsung ke dompet masing-masing, jadi tidak ada yang menitipkan uang ke orang lain. Setiap setoran sewa meninggalkan bukti publik lewat tombol 'Lihat bukti di blockchain'."

### Slide 4: Kenapa onchain (1:20-1:50)

**Judul:** Kepemilikan dan sewa yang bisa diverifikasi sendiri

**Di slide**
- Kepemilikan, sewa, dan jual-beli antar investor terjadi di buku besar publik yang tidak dikendalikan operator.
- Investor memeriksa sendiri tanpa mempercayai database.
- KYC dipaksa oleh smart contract: transfer ke dompet yang belum terverifikasi ditolak kontrak, bukan aplikasi.
- Pasar jual-beli non-kustodian; penjual tetap menerima sewa selama unit dijual.

**Visual:** dompet A -> PropertyToken -> dompet B tidak terverifikasi, silang merah "ditolak kontrak".

**Catatan (30 dtk):** "Kepemilikan, sewa, dan transaksi antar investor ada di buku besar publik yang tidak dikendalikan operator, jadi investor bisa memeriksa sendiri tanpa percaya database, sementara aturan KYC ditegakkan langsung oleh kontrak. Saya akan tunjukkan transfer ke dompet yang belum terverifikasi ditolak, dan itu bukan logika aplikasi."

### Slide 5: Model bisnis (1:50-2:05)

**Judul:** Pemilik membayar, investor tidak

**Di slide**
- Biaya listing dari pemilik: sekitar 3% dari dana terkumpul (asumsi yang akan divalidasi).
- Pemilik butuh modal renovasi atau tambah kamar tanpa agunan bank.
- Investor tidak membayar biaya platform.
- Biaya pasar sekunder: fase berikutnya.

**Visual:** Pemilik -> biaya listing -> URSSET; Investor -> tanpa biaya.

**Catatan (15 dtk):** "Yang membayar adalah pemilik, lewat biaya listing sekitar 3 persen dari dana terkumpul. Ini asumsi yang masih harus kami validasi dengan pemilik kos. Investor tidak membayar biaya platform."

### Slide 6: Kepatuhan (2:05-2:30)

**Judul:** Kami tahu batasnya, dan jalannya

**Di slide**
- **Batas:** token yang mewakili hak atas sewa properti dapat dianggap produk keuangan yang diawasi OJK, dan pembayaran di Indonesia harus dalam Rupiah.
- **Jalan:** kami menempuh OJK Regulatory Sandbox, seperti preseden tokenisasi properti sebelumnya, dengan properti dipegang SPV badan hukum dan Rupiah masuk/keluar lewat penyedia pembayaran berlisensi BI.
- **Sekarang:** untuk hackathon, testnet, non-kustodian, data properti ilustrasi, tanpa dana pengguna sungguhan.

**Visual:** tiga kolom Batas / Jalan / Sekarang.

**Catatan (25 dtk):** "Kami tidak mengklaim sudah patuh. Batasnya: ini bisa dianggap produk keuangan di bawah OJK dan pembayaran harus Rupiah. Jalannya: Regulatory Sandbox OJK, properti di SPV, Rupiah lewat penyedia pembayaran berlisensi. Hari ini: testnet, tanpa uang sungguhan."

### Slide 7: Traksi + langkah berikutnya (2:30-3:00)

**Judul:** Yang sudah jalan, dan yang kami butuhkan

**Di slide**
- Sudah dibangun: 7 kontrak, 45 tes Foundry lulus, skrip end-to-end di testnet, aplikasi hidup dua bahasa.
- Traksi pasar: TODO waitlist (jumlah), TODO wawancara (jumlah), TODO pemilik kos pilot (status).
- Berikutnya: pilot satu kos nyata, aplikasi sandbox OJK, mitra pembayaran berlisensi, biaya pasar sekunder, banyak properti.
- Ajakan: mentor regulasi dan pemilik kos.

**Visual:** garis waktu tiga titik (sekarang, pilot, sandbox), kotak TODO traksi, QR ke ursset.vercel.app.

**Catatan (30 dtk):** "Yang ada bukan hanya slide: tujuh kontrak, 45 tes lulus, dan aplikasi yang bisa dicoba sekarang. Traksi pasar: [TODO data nyata, atau katakan jujur belum ada]. Berikutnya: pilot dengan satu kos nyata, sandbox OJK, mitra pembayaran. Saya mencari mentor regulasi dan pemilik kos. Terima kasih."

### Slide cadangan: Arsitektur

**Judul:** Arsitektur

**Di slide**
- Investor (Next.js, login Privy) -> kontrak di Robinhood Chain Testnet (chain ID 46630).
- Operator (API server): kirim gas, tandai KYC, cetak Rupiah uji, setor sewa.
- KYCRegistry dicek pada setiap transfer PropertyToken.
- PropertyFactory mendaftarkan properti baru dalam satu transaksi (khusus operator).

**Visual:** diagram README: PropertyFactory, PropertyToken, RentDistributor, PrimarySale (+ room), Marketplace, KYCRegistry, MockIDR.

**Catatan:** RentDistributor memakai akumulator pro rata, jadi biaya setoran tidak naik seiring jumlah pemegang. Batas jujur: testnet, QRIS dan KYC simulasi, MockIDR melewati approve, satu kunci operator.

### Peta ke kriteria juri

| Slide | Kriteria utama | Honorable Mention |
|---|---|---|
| 1 | Real-World Utility (25%) | Kreativitas (30%) |
| 2 | Real-World Utility | Inovasi/dampak (20%) |
| 3 | Demo & UX (10%), Innovation (20%) | Kreativitas, presentasi & demo (10%) |
| 4 | Onchain Implementation (25%), Innovation | Inovasi |
| 5 | Feasibility & Scalability (20%) | Dampak potensial |
| 6 | Feasibility & Scalability, Real-World Utility | Mentor favorite (15%) |
| 7 | Feasibility, Real-World Utility | Usaha/eksekusi (25%) |
| Cadangan | Onchain Implementation | Usaha/eksekusi |

---

## English version

### Slide 1: One-line pitch + persona (0:00-0:20)

**Title:** URSSET: urunan asset

**On slide**
- 3 steps, and you own an asset.
- Pool money with friends, buy part of a boarding house, collect the rent, resell any time.
- Units start at Rp10,000.
- Rina, 24, an employee, has never owned property.

**Visual:** large URSSET logo, photo of a boarding house (demo property), Rina with three friends.

**Speaker notes (20 s):** "This is Rina, 24. She wants a share of a property, but her capital is small and crypto sounds complicated. URSSET lets Rina and three friends pool money to buy part of a boarding house from Rp10,000 and receive its monthly rent. Three steps, no seed phrase."

### Slide 2: Problem (0:20-0:45)

**Title:** Property is expensive, and rent reports have to be taken on trust

**On slide**
- Property needs large capital, so young Indonesians are locked out.
- On fractional platforms, investors usually have to trust the operator's rent reports.
- Crypto products ask ordinary people to manage wallets, gas and seed phrases.
- TODO: interview evidence (number of respondents and one real quote).

**Visual:** three barrier icons (capital, trust, complexity) and a box marked TODO for an interview quote.

**Speaker notes (25 s):** "Three barriers. First, capital. Second, trust: investors read rent reports they cannot check themselves. Third, crypto products expect wallets and gas fees. [TODO: interview findings if they exist; otherwise skip this sentence.]"

### Slide 3: Solution (0:45-1:20)

**Title:** Three steps, one Urunan link, rent anyone can verify

**On slide**
- 1 Sign in with email or Google (wallet created for you, no seed phrase, gas covered by the app).
- 2 Top up test Rupiah via QRIS (simulated) plus a light identity check.
- 3 Urunan in one tap; units go to your wallet.
- Urunan Room: one link and a shared target; each friend pays their own share, units go to each person's own wallet. Nobody holds anyone else's money.
- Every rent deposit and its split is a public event.

**Visual:** three phone screens (Sign in, Top up, Urunan) beside the Urunan Room screen with a progress bar.

**Speaker notes (35 s):** "Sign in with email. Top up through QRIS. Tap Urunan. That is it. To pool money, create an Urunan Room, share one link, and each friend joins with their own amount. Units go straight to each person's wallet, so nobody holds anyone else's money. Every rent deposit leaves public proof you can open from 'Lihat bukti di blockchain', which means 'see proof on the blockchain'."

### Slide 4: Why onchain (1:20-1:50)

**Title:** Ownership and rent you can verify yourself

**On slide**
- Ownership, rent payouts and trades between investors happen on a public ledger the operator does not control.
- Investors verify without trusting a database.
- KYC is enforced by the smart contract: a transfer to an unverified wallet is rejected by the contract, not by the app.
- Non-custodial resale; the seller keeps earning rent while listed.

**Visual:** wallet A -> PropertyToken -> unverified wallet B, red cross "rejected by the contract".

**Speaker notes (30 s):** "Ownership, rent payouts and trades between investors happen on a public ledger the operator does not control, so investors can verify for themselves without trusting a database, while KYC rules are enforced directly by the smart contract. I will show a transfer to an unverified wallet being rejected, and that rejection comes from the contract, not the app."

### Slide 5: Business model (1:50-2:05)

**Title:** The owner pays, the investor does not

**On slide**
- Listing fee from the property owner: about 3% of funds raised (assumption to validate).
- Owners need renovation or new-room capital without bank collateral.
- Investors pay no platform fee.
- Secondary-market fee: a later phase.

**Visual:** Owner -> listing fee -> URSSET; Investor -> no fee.

**Speaker notes (15 s):** "The property owner pays a listing fee, about 3 percent of funds raised. That is an assumption we still need to validate with boarding-house owners. Investors pay no platform fee."

### Slide 6: Compliance (2:05-2:30)

**Title:** We know the limit, and the path

**On slide**
- **Limit:** Tokens representing rights to property rent may be treated as financial products supervised by OJK, and payments in Indonesia must be in Rupiah.
- **Path:** We pursue the OJK Regulatory Sandbox, like earlier property tokenization precedents, with the property held by a legal-entity SPV and Rupiah in and out through a BI-licensed payment provider.
- **Now:** For the hackathon: testnet, non-custodial, illustrative property data, no real user funds.

**Visual:** three columns Limit / Path / Now.

**Speaker notes (25 s):** "We do not claim to be compliant. The limit: this may be a financial product under OJK, and payments must be in Rupiah. The path: the OJK Regulatory Sandbox, the property in an SPV, Rupiah through a licensed payment provider. Today: testnet, no real money."

### Slide 7: Traction + next steps (2:30-3:00)

**Title:** What exists, and what we need

**On slide**
- Built: 7 contracts, 45 passing Foundry tests (including invariant and fuzz tests), an end-to-end script on the testnet, a live app in two languages.
- Market traction: TODO waitlist (count), TODO interviews (count), TODO pilot owner (status).
- Next: pilot with one real boarding house, OJK sandbox application, licensed payment partner, secondary-market fees, more properties.
- Ask: regulatory mentors and boarding-house owners.

**Visual:** three-point timeline (now, pilot, sandbox), TODO traction box, QR code to ursset.vercel.app.

**Speaker notes (30 s):** "What exists is a product: seven contracts, 45 passing tests, and a live app you can try now. Market traction: [TODO real numbers, or say plainly that there are none yet]. Next: a pilot with one real boarding house, the sandbox application, and a licensed payment partner. I am looking for regulatory mentors and boarding-house owners. Thank you."

### Backup slide: Architecture

**Title:** Architecture

**On slide**
- Investor (Next.js, Privy login) -> contracts on Robinhood Chain Testnet (chain ID 46630).
- Operator (API server): gas drip, KYC flag, mint test Rupiah, deposit rent.
- KYCRegistry is checked on every PropertyToken transfer.
- PropertyFactory lists a new property in one transaction (operator only).

**Visual:** README diagram: PropertyFactory, PropertyToken, RentDistributor, PrimarySale (+ rooms), Marketplace, KYCRegistry, MockIDR.

**Speaker notes:** RentDistributor uses a pro rata accumulator, so a deposit costs the same regardless of the number of holders. Honest limits: testnet only, QRIS and KYC simulated, MockIDR skips approvals, one operator key.

### Mapping to judging criteria

| Slide | Main track | Honorable Mention |
|---|---|---|
| 1 | Real-World Utility (25%) | Creativity (30%) |
| 2 | Real-World Utility | Innovation / potential impact (20%) |
| 3 | Demo & UX (10%), Innovation (20%) | Creativity, presentation & demo (10%) |
| 4 | Onchain Implementation (25%), Innovation | Innovation |
| 5 | Feasibility & Scalability (20%) | Potential impact |
| 6 | Feasibility & Scalability, Real-World Utility | Mentor favorite (15%) |
| 7 | Feasibility, Real-World Utility | Effort / execution (25%) |
| Backup | Onchain Implementation | Effort / execution |
