"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "id" | "en";

// Indonesian is the source text and doubles as the key. Missing English falls back to Indonesian.
const en: Record<string, string> = {
  // header and shared
  Portofolio: "Portfolio",
  Masuk: "Sign in",
  Keluar: "Sign out",
  Memuat: "Loading",
  "Memuat…": "Loading…",
  "Memproses…": "Processing…",
  "Lihat bukti di blockchain": "View proof on blockchain",
  bukti: "proof",
  Rp0: "Rp0",
  // home
  "Demo · jaringan uji": "Demo · test network",
  "3 langkah,": "3 steps,",
  "kamu punya aset.": "you own an asset.",
  "Urunan bareng teman beli bagian rumah kos, terima sewanya tiap bulan, dan jual lagi kapan saja.":
    "Chip in with friends to buy a share of a boarding house, receive the rent every month, and sell any time.",
  "Email atau Google, 10 detik": "Email or Google, 10 seconds",
  "Isi saldo": "Top up",
  "QRIS, mulai Rp10 ribu": "QRIS, from Rp10k",
  Urunan: "Chip in",
  "Satu tap, kamu punya aset": "One tap, you own an asset",
  "Properti tersedia": "Available properties",
  "Belum ada properti.": "No properties yet.",
  "Ini demo hackathon di jaringan uji dengan data ilustrasi dan Rupiah uji. Bukan penawaran investasi dan tidak ada imbal hasil yang dijanjikan.":
    "This is a hackathon demo on a test network with illustrative data and test Rupiah. It is not an investment offer and no return is promised.",
  "Mulai urunan": "Start chipping in",
  "Rumah kos · ilustrasi demo": "Boarding house · demo illustration",
  kamar: "rooms",
  terisi: "occupied",
  "per unit": "per unit",
  "nilai (ilustrasi)": "value (illustrative)",
  "total unit": "total units",
  // activity
  "Aktivitas terbaru": "Latest activity",
  "Belum ada urunan. Jadilah yang pertama.": "No activity yet. Be the first.",
  "urunan {n} unit": "chipped in {n} units",
  "di room #{id}": "in room #{id}",
  "Sewa {amount} dibagikan ke pemegang unit": "Rent of {amount} was paid out to unit holders",
  // progress
  terjual: "sold",
  terkumpul: "raised",
  "{value} dari {max} unit {label} ({pct}%)": "{value} of {max} units {label} ({pct}%)",
  // three steps
  "Masuk dengan email atau Google": "Sign in with email or Google",
  "Tanpa aplikasi tambahan dan tanpa kata sandi baru. Sekitar 10 detik.":
    "No extra app and no new password. About 10 seconds.",
  "Masuk untuk mulai": "Sign in to start",
  "Isi saldo Rupiah": "Top up your balance",
  "Pembayaran QRIS disimulasikan. Saldo di demo adalah Rupiah uji (tIDR).":
    "The QRIS payment is simulated. The demo balance is test Rupiah (tIDR).",
  "Verifikasi cepat": "Quick verification",
  "Wajib sebelum membeli. Demo: data ini tidak disimpan dan tidak masuk blockchain.":
    "Required before buying. Demo: this data is not stored and never goes onchain.",
  "Nama sesuai KTP": "Full name as on ID",
  "Saya paham ini demo di jaringan uji dan bukan penawaran investasi.":
    "I understand this is a demo on a test network and not an investment offer.",
  "Bayar {amount} lewat QRIS": "Pay {amount} with QRIS",
  "Menunggu pembayaran (simulasi)…": "Waiting for payment (simulated)…",
  "Memverifikasi dan mengisi saldo…": "Verifying and topping up…",
  "Pilih nominal urunan": "Choose how much to chip in",
  "1 unit = {price}. Saldo kamu {balance}.": "1 unit = {price}. Your balance is {balance}.",
  "Jumlah unit": "Units",
  "Harga per unit": "Price per unit",
  "Biaya untuk kamu": "Fee for you",
  Total: "Total",
  "Urunan {amount}": "Chip in {amount}",
  "Kamu punya {n} unit!": "You own {n} units!",
  "Bagian {name} senilai {amount} sekarang atas namamu.": "Your share of {name} worth {amount} is now in your name.",
  "Lihat portofolio": "View portfolio",
  "Urunan lagi": "Chip in again",
  // create room
  "Buat Urunan Room": "Create an Urunan Room",
  "Bagikan satu link, teman ikut dengan nominal masing-masing.":
    "Share one link and friends join with their own amounts.",
  "Nama room": "Room name",
  "Target unit": "Target units",
  "Membuat room…": "Creating room…",
  "Buat room dan dapatkan link": "Create room and get the link",
  "Masuk untuk membuat room": "Sign in to create a room",
  "Urunan Kos": "Urunan Room",
  // property page
  "Riwayat sewa (onchain)": "Rent history (onchain)",
  "Belum ada setoran sewa. Setiap setoran dan pembagiannya tercatat di sini dan bisa dicek siapa pun.":
    "No rent deposits yet. Every deposit and its split is recorded here and anyone can check it.",
  "{amount} untuk {n} unit beredar": "{amount} for {n} circulating units",
  "Tentang properti": "About the property",
  "Hash dokumen hukum disimpan di kontrak, jadi perubahan dokumen bisa dideteksi.":
    "The hash of the legal documents is stored in the contract, so changes to the documents can be detected.",
  "Lihat kontrak di explorer": "View contract on explorer",
  "Kamu punya {n} unit": "You own {n} units",
  "Properti tidak ditemukan.": "Property not found.",
  // room page
  "Urunan Room #{id}": "Urunan Room #{id}",
  "Dibuat oleh {who} · {n} orang ikut": "Created by {who} · {n} people joined",
  "Kontribusimu: {n} unit": "Your contribution: {n} units",
  "Link disalin": "Link copied",
  "Ajak teman urunan": "Invite friends",
  "Memuat room…": "Loading room…",
  "Room tidak ditemukan.": "Room not found.",
  // portfolio
  Portofoliomu: "Your portfolio",
  "Masuk untuk melihat unit dan sewa yang masuk.": "Sign in to see your units and rent.",
  "Nilai unit (harga awal)": "Unit value (initial price)",
  "{n} unit · saldo {balance}": "{n} units · balance {balance}",
  "Saldo Rupiah uji": "Test Rupiah balance",
  "Belum terverifikasi": "Not verified yet",
  "Sewa yang masuk": "Rent received",
  "Dibagi proporsional dari setoran sewa yang tercatat onchain.":
    "Split proportionally from the rent deposits recorded onchain.",
  "Ambil sewa": "Claim rent",
  "Sewa masuk ke saldomu.": "Rent was added to your balance.",
  "Jual unit": "Sell units",
  "Pasang harga, investor terverifikasi lain bisa membeli kapan saja.":
    "Set a price and other verified investors can buy any time.",
  "Harga per unit (Rp)": "Price per unit (Rp)",
  "Jual {n} unit di {price}": "Sell {n} units at {price}",
  "Penawaran dipasang.": "Listing created.",
  "Pasar sekunder": "Secondary market",
  "Belum ada penawaran aktif.": "No active listings.",
  kamu: "you",
  "dari {who} · total {total}": "from {who} · total {total}",
  Batal: "Cancel",
  Beli: "Buy",
  "Penawaran dibatalkan.": "Listing cancelled.",
  "Unit berpindah ke kamu.": "The units are now yours.",
  "Kirim unit ke wallet lain": "Send units to another wallet",
  "Coba kirim ke alamat yang belum terverifikasi: smart contract akan menolaknya.":
    "Try sending to an unverified address: the smart contract will reject it.",
  "0x… alamat tujuan": "0x… destination address",
  Kirim: "Send",
  "Unit terkirim.": "Units sent.",
  "Belum punya unit di properti ini.": "You hold no units in this property yet.",
  // operator
  "Pemilik kos (demo)": "Property owner (demo)",
  "Setor sewa bulan ini": "Deposit this month's rent",
  "Sewa dibagi ke semua unit yang sudah terjual. Unit yang belum terjual tidak menerima sewa.":
    "Rent is split across all sold units. Unsold units receive no rent.",
  Properti: "Property",
  "Unit beredar": "Circulating units",
  "Sudah dibagikan sejauh ini": "Paid out so far",
  "Sewa per unit (Rp)": "Rent per unit (Rp)",
  "Kode operator": "Operator code",
  "Setor {amount}": "Deposit {amount}",
  "Sewa {amount} dibagikan.": "Rent of {amount} was paid out.",
  "Daftarkan properti baru": "List a new property",
  "Pemilik mendaftarkan kos: kontrak token, penjualan, sewa, dan marketplace dipasang otomatis dalam satu transaksi.":
    "An owner lists a boarding house: the token, sale, rent and marketplace contracts are deployed automatically in one transaction.",
  "Nama properti": "Property name",
  Kota: "City",
  "Jumlah kamar": "Number of rooms",
  "Okupansi (%)": "Occupancy (%)",
  "Nilai properti (Rp)": "Property value (Rp)",
  Deskripsi: "Description",
  Foto: "Photos",
  "Unggah foto": "Upload photos",
  "Mengunggah…": "Uploading…",
  "atau tempel link gambar": "or paste an image link",
  Tambah: "Add",
  Hapus: "Remove",
  "Unggah foto belum aktif (Vercel Blob belum disambungkan). Tempel link gambar saja.":
    "Photo upload is not enabled (Vercel Blob is not connected). Paste image links instead.",
  "Unit akan dibuat: {n} unit @ {price}": "Units to be created: {n} @ {price}",
  "Daftarkan properti": "List property",
  "Mendaftarkan di blockchain…": "Listing onchain…",
  "Properti terdaftar.": "Property listed.",
  "Lihat halaman properti": "View property page",
  Bahasa: "Language",
  // menu, portfolio sections, city picker
  Menu: "Menu",
  "Tutup menu": "Close menu",
  Beranda: "Home",
  Investor: "Investor",
  "Pemilik properti": "Property owners",
  "Setor sewa": "Deposit rent",
  "Properti kamu": "Your properties",
  "Properti yang sebaiknya kamu miliki sekarang": "Properties you should own now",
  "Tambah unit atau mulai dari properti lain, mulai Rp10.000.":
    "Add units or start with another property, from Rp10,000.",
  "Kamu belum punya unit di properti mana pun. Mulai dari yang di bawah.":
    "You do not hold units in any property yet. Start with one below.",
  "Cari kota…": "Search city…",
  "Kota tidak ditemukan": "City not found",
  "Gambar tidak dapat dimuat": "Image could not be loaded",
  // errors (client and server)
  "Ditolak oleh smart contract: wallet itu belum terverifikasi KYC.":
    "Rejected by the smart contract: that wallet is not KYC verified.",
  "Unit yang tersisa tidak cukup.": "Not enough units left.",
  "Saldo tidak cukup.": "Insufficient balance.",
  "Unit yang kamu miliki tidak cukup.": "You do not hold enough units.",
  "Izin transfer unit belum diberikan.": "Transfer permission has not been granted.",
  "Belum ada sewa yang bisa diambil.": "There is no rent to claim yet.",
  "Penawaran ini sudah tidak aktif.": "This listing is no longer active.",
  "Dibatalkan.": "Cancelled.",
  "Gas habis. Muat ulang halaman, lalu coba lagi.": "Out of gas. Reload the page and try again.",
  "Belum masuk": "Not signed in",
  "Sesi tidak valid, masuk lagi": "Invalid session, please sign in again",
  "Wallet bukan milik akun ini": "This wallet does not belong to this account",
  "Kode operator salah": "Wrong operator code",
  "Nominal tidak valid": "Invalid amount",
  "Batas saldo demo tercapai": "Demo balance limit reached",
  "Nominal harus Rp10.000 sampai Rp1.000.000": "Amount must be between Rp10,000 and Rp1,000,000",
  "Unggah foto belum aktif": "Photo upload is not enabled",
  "Gambar maksimal 4 MB": "Images are limited to 4 MB",
  "Hanya file gambar": "Image files only",
  "Terjadi kesalahan di server": "Something went wrong on the server",
  "Properti tidak ditemukan": "Property not found",
  "Permintaan gagal": "Request failed",
  "Link gambar tidak bisa dibuka. Coba unggah file atau pakai link lain.":
    "That image link could not be opened. Try uploading a file or another link.",
  "Link itu bukan gambar langsung. Klik kanan gambarnya lalu salin alamat gambar, atau unggah file.":
    "That link is not a direct image. Right-click the image and copy the image address, or upload a file.",
  "Nama properti terlalu pendek": "Property name is too short",
  "Jumlah unit terlalu besar": "Too many units",
  Gagal: "Failed",
  "Dokumen (satu per baris)": "Documents (one per line)",
};

type Vars = Record<string, string | number>;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (text: string, vars?: Vars) => string };

const I18nContext = createContext<Ctx>({ lang: "id", setLang: () => undefined, t: s => s });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ursset-lang");
      if (saved === "en" || saved === "id") setLangState(saved);
    } catch {
      // storage can be blocked in private windows
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("ursset-lang", l);
    } catch {
      // ignore
    }
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (text: string, vars?: Vars) => {
      const base = lang === "en" ? (en[text] ?? text) : text;
      return vars ? base.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : base;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
