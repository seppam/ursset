# URSSET: catatan serah terima (9 Okt 2026, malam)

Dokumen ini untuk melanjutkan pekerjaan di sesi baru. Baca ini dulu, lalu `docs/PITCH.md`, `docs/DEMO-SCRIPT.md`, `docs/SUBMISSION.md`.

## Ringkas

URSSET ("urunan asset" / "your asset") adalah submission **Ethereum Jakarta Hackathon 2026** (tema RWA), dikerjakan solo oleh Septian. Properti sewaan (kos) difraksikan di **Robinhood Chain Testnet** (chain ID 46630). Pengguna masuk dengan email atau Google (wallet Privy otomatis, tanpa gas), isi saldo (QRIS simulasi + KYC ringan), lalu "Urunan" dalam satu tap. Semua data demo.

- Aplikasi live: https://ursset.vercel.app (auto-deploy dari `main` di GitHub `seppam/ursset`)
- Repo lokal: `/Users/macbook/Documents/ursset` (monorepo Scaffold-ETH 2: `packages/foundry`, `packages/nextjs`)
- Dokumen rencana (Claude Docs, dua tab ID dan EN): https://claude.ai/code/artifact/6023c5d6-25a8-4071-ab52-06650a6adcc0 (ada bagian "Status build")
- **Batas submit: Sabtu 10 Okt 2026 pukul 12.00 WIB** (target kirim 10.30). Demo Day: Minggu 11 Okt di Ganara Art, Jakarta. Platform: HackQuest, akun Septian sudah terdaftar sebagai solo builder.

## Yang sudah selesai

| Area | Status |
| --- | --- |
| 7 kontrak (KYCRegistry, MockIDR, PropertyFactory, PropertyToken, RentDistributor, PrimarySale, Marketplace) | Selesai, **45 tes Foundry lolos** (termasuk invariant dan fuzz dari auditor), deploy final bersih di testnet |
| Alur 3 langkah, Urunan Room, portofolio (kartu per properti yang bisa dibuka), ambil sewa, jual-beli ulang, penolakan KYC | Selesai, diuji dengan akun sungguhan di HP |
| Area pemilik `/operator` ("Kelola"): daftar properti (foto via Vercel Blob, kota dari daftar, validasi saat submit), setor sewa | Selesai, diuji |
| Profil `/profile`: isi saldo, alamat wallet, ekspor kunci (Privy), riwayat transaksi dari event on-chain, panduan | Selesai, **belum dilihat dalam keadaan login** |
| UI/UX redesign (tab bar bawah: Beranda, Portofolio, Kelola, Profil; drawer ☰), logo dan aset, ID/EN (`?lang=en`) | Selesai |
| Audit keamanan (`docs/SECURITY.md`), README, UX map (`docs/UX.md`) | Selesai |
| Dokumen pitch dua bahasa, skrip video, teks submission, tanya-jawab juri | Selesai (sisa TODO di bawah) |
| **Video pitch English** (slide + narasi suara macOS "Samantha" + caption) | Selesai, ada di `~/Documents/URSSET-videos/pitch/` (di luar repo) |

## Yang masih harus dikerjakan (urutan)

1. **Ganti suara video pitch dengan VoiceStudio** (permintaan Septian). Jalankan `~/.claude/scripts/voicestudio-ensure.sh` dulu (lihat memori `voicestudio-auto-start`), generate audio English per slide dari `~/Documents/URSSET-videos/pitch/narration/NN.txt`, simpan sebagai `narration/NN.human.m4a`, lalu `cd ~/Documents/URSSET-videos/pitch && ./build.sh` (sekitar 6 menit). Septian harus mendengarkan hasilnya (agen tidak bisa menilai audio). Kalau MCP `voicestudio` gagal tersambung, tanyakan ke user atau panggil backend `127.0.0.1:3900` langsung.
2. **Video demo English (rekaman layar aplikasi live).** Septian sudah bilang siap login. Rencana: buka Chrome khusus rekaman dengan `--remote-debugging-port` dan `--user-data-dir` sementara, Septian login sekali (email atau Google), lalu otomatiskan alur lewat CDP (puppeteer-core di folder sementara di luar repo), rekam frame screencast, gabung dengan ffmpeg, narasi English (VoiceStudio) dan caption. UI diset English lewat `?lang=en`. Ikuti bagian video demo di `docs/DEMO-SCRIPT.md`. Simpan hasil di `~/Documents/URSSET-videos/demo/`. Lakukan pre-flight dulu (di bawah). Jangan tampilkan email, kode operator, atau kunci di layar.
3. **Isi TODO yang tersisa** (`docs/SUBMISSION.md`: bio singkat, kontak opsional, link video dan deck setelah diunggah, cara juri mengakses area pemilik; `docs/DEMO-SCRIPT.md`: link video). **Tidak ada bukti wawancara dan tidak akan ada**; dokumen sudah dibuat jujur soal itu (jangan mengarang angka, waitlist, atau pilot).
4. Septian mengunggah video, mengisi HackQuest (teks siap di `docs/SUBMISSION.md`), submit sebelum Sabtu 12.00 WIB.
5. Opsional kalau waktu ada: cek di HP halaman Profil dan kartu portofolio yang baru; CTA menempel di bawah halaman properti (ponsel); kolom deskripsi English untuk properti yang didaftarkan lewat form; tambahan dari `docs/UX.md` dan `docs/SECURITY.md`.

### Pre-flight sebelum merekam demo
- Saldo ETH testnet wallet operator `0xBF65cC92570ed861cA0E235F383a2434Cac33EA8` (alamat publik): terakhir sekitar 0,0086 ETH. Faucet 0,01 ETH per 24 jam, klaim berikutnya sekitar Sabtu pagi. Satu pengguna baru menghabiskan sekitar 0,0001 ETH untuk gas drip.
- Kondisi chain bersih (dua properti contoh, 0 unit terjual) saat ini. Setiap rekaman menambah data; kalau perlu bersih lagi, deploy ulang (lihat di bawah, biaya sekitar 0,000125 ETH).
- Kode operator ada di `packages/nextjs/.env.local` (`OPERATOR_PASSCODE`) dan di env Vercel. Jangan dicetak di layar atau repo.
- Wallet baru: pakai email atau akun Google yang belum dipakai untuk demo bersih, atau terima bahwa akun lama sudah punya saldo (kontrak lama dihapus saat deploy final, jadi semua akun mulai dari nol).

## Peta teknis

- **Kontrak:** `packages/foundry/contracts/*.sol`; tes `packages/foundry/test/{URSSET,Factory,Invariants}.t.sol`; deploy `packages/foundry/script/Deploy.s.sol`. Foundry memakai `via_ir`.
- **Deploy ulang:** `cd packages/foundry && PK=$(grep '^DEPLOYER_PRIVATE_KEY=' .env | cut -d= -f2-) && forge script script/Deploy.s.sol --rpc-url robinhood --private-key "$PK" --broadcast --ffi && node scripts-js/exportUrsset.mjs 46630` lalu commit `packages/nextjs/lib/generated/ursset.ts`, push, isi alamat baru ke README dan `docs/SUBMISSION.md`. Kunci jangan dicetak.
- **Alamat final** (Robinhood Chain Testnet): lihat tabel di README. Factory `0x5f0c4e0b03127ea3f251d7bf87d29be29f07c5f6`.
- **Frontend:** `packages/nextjs` (Next.js 16, Tailwind v4, wagmi/viem, Privy). Halaman: `/`, `/p/[id]`, `/p/[id]/room/[roomId]`, `/portfolio`, `/profile`, `/operator`. API server: `app/api/{onboard,kyc,topup,rent,listing,upload,rpc}`; logika operator di `lib/server/operator.ts`. Terjemahan: kamus di `lib/i18n.tsx` plus `lib/i18n-{portfolio,owner,profile}.ts`; semua teks UI lewat `useT()` (teks Indonesia jadi kunci).
- **Uji end-to-end di testnet:** `cd packages/nextjs && PROPERTY_ID=1 node scripts/e2e.mjs` (membuat dompet sementara; jangan dijalankan ke chain final sebelum demo karena menambah data uji).
- **Aset merek:** `node scripts/make-assets.mjs` (logo, ikon, gambar sosial).
- **Env** (nama saja, nilai jangan dicetak): `packages/foundry/.env` (`DEPLOYER_PRIVATE_KEY`); `packages/nextjs/.env.local` (`NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `DEPLOYER_PRIVATE_KEY`, `OPERATOR_PASSCODE`). Vercel punya empat variabel yang sama plus token Blob (store Public, awalan `BLOB`). Privy: App ID `cmv0d3ff5002f0fjtrhhxjnrc` (publik), login Email dan Google aktif, secret sudah diganti.
- **Jaringan:** domain Robinhood diblokir DNS operator seluler Indonesia tertentu; DNS Mac sudah diganti ke `1.1.1.1` dan `1.0.0.1`. Aplikasi sendiri memproksi RPC lewat `/api/rpc`, jadi pengguna tidak terdampak.

## Pelajaran proses (hindari kesalahan berulang)

- Subagen dengan `isolation: worktree` membuat cabang dari **origin/main**, bukan HEAD lokal. Push dulu sebelum menyuruh agen bekerja, atau siap menyelesaikan konflik. Gabungkan dengan `git merge --no-edit <cabang> && ...` dan **hanya hapus worktree dan cabang kalau merge sukses** (rantai dengan `&&`).
- Husky lint-staged memformat ulang file (prettier) saat commit, jadi pola teks di file berubah setelah commit. Baca ulang sebelum mengedit lewat penggantian string.
- File generated `lib/generated/ursset.ts` diformat prettier (kunci tanpa tanda kutip kecuali alamat); parser harus toleran.
- Input terminal interaktif (`read -s`) tidak jalan di kotak `!` obrolan; harus di tab Terminal asli. Rahasia jangan diminta di obrolan: pakai editor teks atau `read -s` di Terminal.
- Chrome headless untuk tangkapan layar: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=500,H --virtual-time-budget=15000 --screenshot=x.png URL` (lebar minimum efektif 500). Panel browser bawaan sering tidak tampil.
- Setelah `export PATH=...` yang salah, shell bisa kehilangan `awk`, `ls`, dll. Awali perintah dengan `export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$HOME/.local/bin:$HOME/.foundry/bin"`.
- Pesan error server (validasi) sebagian masih Indonesia saat UI English; kamus punya terjemahan untuk yang umum.
