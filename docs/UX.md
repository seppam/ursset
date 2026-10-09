# URSSET: Peta UX

Catatan riset: halaman referensi (Finora/Dribbble, Mamikos, GORO, Fomo) hanya terbaca sebagian lewat WebFetch (judul/ringkasan pemasaran). Pola di bawah memakai pola umum yang mapan, bukan detail yang dikutip dari situs tersebut.

## 1. Persona

| Persona | Tujuan | Kekhawatiran |
|---|---|---|
| Rina, investor pemula (24 th, karyawan) | Punya bagian properti dengan modal kecil | "Ribet kripto? Aman? Berapa biayanya?" |
| Budi, investor kembali | Cek sewa masuk, ambil sewa, jual unit | "Berapa total nilaiku? Mudah jual?" |
| Bu Sari, pemilik kos | Mendaftarkan kos, setor sewa bulanan | "Apa yang harus diisi? Bukti sudah tersetor?" |

## 2. Alur utama

| Persona | Alur | Layar |
|---|---|---|
| Pemula | Buka link -> baca Cara kerja -> pilih properti -> Mulai urunan -> Masuk -> Isi saldo (QRIS + verifikasi) -> Urunan -> lihat bukti | Beranda, Detail properti (panel 3 langkah), Portofolio |
| Pemula via teman | Buka link Urunan Room -> panel 3 langkah -> urunan | Room |
| Investor kembali | Portofolio -> Ambil sewa / Jual unit / Beli di pasar sekunder | Portofolio |
| Pemilik | Kelola -> Daftarkan properti (foto) -> Setor sewa | /operator#listing, /operator#rent |

## 3. Arsitektur informasi dan label menu

| Posisi | Label ID | Label EN | Tujuan |
|---|---|---|---|
| Tab bawah 1 | Beranda | Home | `/` |
| Tab bawah 2 | Portofolio | Portfolio | `/portfolio` |
| Tab bawah 3 | Kelola | Manage | `/operator` (area pemilik) |
| Tab bawah 4 | Menu | Menu | Buka drawer |
| Drawer, Investor | Beranda, Portofolio, Cara kerja | Home, Portfolio, How it works | `/`, `/portfolio`, `/#cara-kerja` |
| Drawer, Pemilik properti | Kelola properti, Daftarkan properti, Setor sewa | Manage properties, List property, Deposit rent | `/operator`, `#listing`, `#rent` |
| Drawer | Bahasa, Keluar, GitHub, Explorer | Language, Sign out | |

Di desktop (>=768px) tab bawah diganti tautan di header.

## 4. Inventaris layar

| Layar | Informasi wajib |
|---|---|
| Beranda | Janji 3 langkah, label demo/jaringan uji, Cara kerja + bukti onchain, kartu properti (foto, kota, harga per unit, progres, chip Terverifikasi onchain), aktivitas, disclaimer |
| Detail properti | Foto, nama, kota, nilai (ilustrasi), keterisian, total unit, progres, chip kepercayaan, panel 3 langkah (sticky di desktop), CTA sticky "Mulai urunan" di mobile, riwayat sewa onchain, tentang + dokumen + tautan kontrak |
| Room | Target bersama, progres, panel 3 langkah |
| Portofolio | Saldo, aksi cepat (Urunan, Ambil sewa, Jual unit), per properti: nilai, unit, sewa masuk, jual, pasar sekunder, kirim unit (demo penolakan KYC), properti lain |
| Operator | Daftarkan properti (foto, kota), setor sewa per properti |

## 5. Keadaan kosong, memuat, galat

| Keadaan | Perlakuan |
|---|---|
| Memuat | Skeleton kartu/detail, bukan teks "Memuat…" |
| Kosong | Portofolio: "Belum ada unit" + arahan ke properti; Beranda: arahan ke menu Kelola; aktivitas: ajakan jadi yang pertama |
| Galat | Pesan Indonesia dari `friendlyError`, tampil di kartu aksi terkait |
| Belum masuk | Portofolio menampilkan ikon + tombol Masuk |

## 6. Masalah UX pada aplikasi awal (prioritas)

| # | Masalah | Bukti | Status |
|---|---|---|---|
| 1 | Navigasi hanya lewat drawer tersembunyi; tidak ada penunjuk lokasi | `components/Header.tsx` | Diperbaiki: tab bawah + header desktop |
| 2 | Tombol beli di detail properti jauh di bawah; tidak ada CTA menempel | `app/p/[id]/page.tsx` | Diperbaiki: CTA sticky + anchor `#mulai` |
| 3 | Tidak ada penjelasan "Cara kerja" dan bukti onchain di beranda | `app/page.tsx` | Diperbaiki |
| 4 | "Memuat…" polos | beranda, detail, portofolio | Diperbaiki: skeleton |
| 5 | Layout satu kolom sempit di desktop | `app/layout.tsx` (`max-w-md`) | Diperbaiki: grid dan dua kolom |
| 6 | Ikon emoji, target sentuh < 44px, warna muted kontras rendah | Header, `globals.css` | Diperbaiki: SVG, min 44px, `--color-muted` lebih gelap |
| 7 | Portofolio tanpa ringkasan gaya aplikasi keuangan | `app/portfolio/page.tsx` | Diperbaiki: header ringkasan + aksi cepat |
| 8 | Total nilai semua properti belum dijumlah di portofolio | portofolio | Belum |
| 9 | Halaman operator belum memakai pola kartu/skeleton baru | `app/operator/page.tsx` | Belum |
| 10 | Tidak ada filter/pencarian properti (perlu saat daftar bertambah) | beranda | Belum |
