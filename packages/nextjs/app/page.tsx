import { ActivityFeed } from "~~/components/ActivityFeed";
import { PropertyCard } from "~~/components/PropertyCard";

const steps = [
  { n: 1, title: "Masuk", body: "Email atau Google, 10 detik" },
  { n: 2, title: "Isi saldo", body: "QRIS, mulai Rp10 ribu" },
  { n: 3, title: "Urunan", body: "Satu tap, kamu punya aset" },
];

export default function Home() {
  return (
    <div className="space-y-4">
      <section className="pt-2">
        <span className="chip">Demo · jaringan uji</span>
        <h1 className="mt-2 text-3xl font-black leading-tight">
          3 langkah,
          <br />
          kamu punya aset.
        </h1>
        <p className="mt-2 text-muted">
          Urunan bareng teman beli bagian rumah kos, terima sewanya tiap bulan, dan jual lagi kapan saja.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {steps.map(s => (
          <div key={s.n} className="card p-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {s.n}
            </span>
            <p className="mt-2 text-sm font-extrabold">{s.title}</p>
            <p className="text-xs text-muted">{s.body}</p>
          </div>
        ))}
      </section>

      <PropertyCard />
      <ActivityFeed />

      <p className="px-1 text-xs text-muted">
        Ini demo hackathon di jaringan uji dengan data ilustrasi dan Rupiah uji. Bukan penawaran investasi dan tidak ada
        imbal hasil yang dijanjikan.
      </p>
    </div>
  );
}
