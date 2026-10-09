/** English strings for the owner area (/operator). Indonesian text is the key, same as lib/i18n.tsx. */
export const ownerEn: Record<string, string> = {
  // page
  "Pemilik kos (demo)": "Boarding house owner (demo)",
  "Kelola properti": "Manage properties",
  "Daftarkan kos baru atau setor sewa bulan ini. Semua data di sini adalah data uji.":
    "List a new boarding house or deposit this month's rent. All data here is test data.",
  "Bagian halaman": "Page sections",
  "Setor sewa": "Deposit rent",
  "Daftarkan properti": "List property",
  "Kode operator": "Operator code",
  "Kode khusus pemilik/panitia demo. Dipakai untuk setor sewa dan mendaftarkan properti.":
    "Special code for owners and demo organisers. Used to deposit rent and to list a property.",
  // shared form bits
  "wajib diisi": "required",
  "(opsional)": "(optional)",
  "Lihat bukti di blockchain": "View proof on blockchain",
  "Lihat halaman properti": "View property page",
  "{label} harus antara {min} dan {max}": "{label} must be between {min} and {max}",
  "Jumlah kamar": "Number of rooms",
  Okupansi: "Occupancy",
  "Nilai properti": "Property value",
  "Harga unit": "Unit price",
  "Nominal tidak valid": "Invalid amount",
  "Properti tidak valid": "Invalid property",
  "Operator belum dikonfigurasi": "Operator is not configured",
  "Unggah foto belum aktif": "Photo upload is not enabled",
  "Hanya file gambar": "Image files only",
  "File tidak ditemukan": "File not found",
  "Gambar maksimal 4 MB": "Images can be 4 MB at most",
  "Kode operator salah": "Wrong operator code",
  "Data terlalu besar tanpa Vercel Blob; kurangi jumlah foto atau deskripsi":
    "Data is too large without Vercel Blob; use fewer photos or a shorter description",
  "Koneksi terputus": "Connection lost",
  "Gagal memproses gambar": "Could not process the image",
  "Gagal mengunggah": "Upload failed",
  "Isi Kode operator dulu, lalu coba lagi": "Enter the operator code first, then try again",
  // validation messages
  "Isi Kode operator": "Enter the operator code",
  "Nama properti minimal 3 huruf": "Property name needs at least 3 letters",
  "Pilih kota dari daftar": "Choose a city from the list",
  "Isi 1 sampai 500 kamar": "Enter 1 to 500 rooms",
  "Isi 0 sampai 100 persen": "Enter 0 to 100 percent",
  "Nilai harus antara Rp100 juta dan Rp100 miliar": "Value must be between Rp100 million and Rp100 billion",
  "Tunggu sampai unggahan foto selesai": "Wait until the photo uploads finish",
  "Ada foto yang gagal. Coba lagi atau hapus foto itu.": "Some photos failed. Retry or remove them.",
  "Tambahkan minimal 1 foto (unggah dari perangkat atau dari link)":
    "Add at least 1 photo (upload from your device or from a link)",
  "Maksimal {max} foto. Kurangi {n} foto.": "At most {max} photos. Remove {n}.",
  "Ada link gambar yang tidak valid. Periksa baris yang ditandai.":
    "Some image links are not valid. Check the marked lines.",
  "Isi sewa per unit, minimal Rp1": "Enter the rent per unit, at least Rp1",
  // listing form
  "Daftarkan properti baru": "List a new property",
  "Pemilik mendaftarkan kos: kontrak token, penjualan, sewa, dan marketplace dipasang otomatis dalam satu transaksi.":
    "The owner lists a boarding house: the token, sale, rent and marketplace contracts are deployed automatically in one transaction.",
  "Properti terdaftar": "Property listed",
  "{name}: {n} unit dibuat @ {price}.": "{name}: {n} units created @ {price}.",
  "Nama properti": "Property name",
  Kota: "City",
  "Ketik untuk mencari, lalu pilih dari daftar.": "Type to search, then pick from the list.",
  "Okupansi (%)": "Occupancy (%)",
  "1 sampai 500": "1 to 500",
  "0 sampai 100": "0 to 100",
  "Nilai properti (Rp)": "Property value (Rp)",
  "Rp100 juta sampai Rp100 miliar": "Rp100 million to Rp100 billion",
  Deskripsi: "Description",
  "Dokumen (satu per baris)": "Documents (one per line)",
  "Foto dari perangkat": "Photos from your device",
  "Minimal 1 foto, maksimal 6. Boleh digabung dengan link gambar di bawah.":
    "At least 1 photo, at most 6. You can combine them with image links below.",
  "Unggah foto": "Upload photos",
  "Mengunggah…": "Uploading…",
  "Unggah foto belum aktif (Vercel Blob belum disambungkan). Tempel link gambar saja.":
    "Photo upload is not enabled yet (Vercel Blob is not connected). Paste image links instead.",
  "Atau dari link gambar (satu per baris)": "Or from image links (one per line)",
  "Tempel alamat gambar (diawali https://). Link diperiksa dan disalin saat kamu menekan Daftarkan.":
    "Paste image addresses (starting with https://). Links are checked and copied when you press List property.",
  "Baris {n} tidak valid: {text}": "Line {n} is not valid: {text}",
  Sampul: "Cover",
  "Coba lagi": "Retry",
  "Hapus foto {name}": "Remove photo {name}",
  Pratinjau: "Preview",
  "Foto sampul": "Cover photo",
  "Foto sampul belum ada": "No cover photo yet",
  "{n} unit @ {price}": "{n} units @ {price}",
  "Unit akan dibuat: {n} unit @ {price}": "Units to be created: {n} units @ {price}",
  Lengkapi: "Please complete",
  Foto: "Photos",
  "Link gambar": "Image links",
  "Mengunggah/menyalin foto": "Uploading/copying photos",
  "Foto siap": "Photos ready",
  "Memasang kontrak di blockchain": "Deploying contracts on the blockchain",
  "Mendaftarkan…": "Listing…",
  "Demo di jaringan uji. Data ilustrasi, bukan penawaran investasi.":
    "Demo on a test network. Illustrative data, not an investment offer.",
  // rent
  "Setor sewa bulan ini": "Deposit this month's rent",
  "Sewa dibagi ke semua unit yang sudah terjual. Unit yang belum terjual tidak menerima sewa.":
    "Rent is split across all units sold. Unsold units receive no rent.",
  "Setoran masuk ke kontrak sewa, lalu setiap pemegang unit bisa mengambil bagiannya sesuai jumlah unit.":
    "The deposit goes into the rent contract, then each unit holder can claim a share in proportion to their units.",
  Properti: "Property",
  "Belum ada properti.": "No properties yet.",
  "Unit beredar": "Units in circulation",
  "unit yang sudah terjual": "units already sold",
  "Sudah dibagikan sejauh ini": "Paid out so far",
  "total sewa yang pernah disetor": "total rent ever deposited",
  "Sewa per unit (Rp)": "Rent per unit (Rp)",
  "Total yang akan disetor": "Total to be deposited",
  "{units} unit × {price} per unit": "{units} units × {price} per unit",
  "Belum ada unit terjual di properti ini, jadi belum ada yang bisa menerima sewa.":
    "No units have been sold in this property yet, so nobody can receive rent.",
  "Memproses…": "Processing…",
  "Setor {amount}": "Deposit {amount}",
  "Sewa {amount} dibagikan.": "Rent of {amount} was paid out.",
};

// i18n.tsx merges this dictionary under this name.
export const enOwner = ownerEn;
