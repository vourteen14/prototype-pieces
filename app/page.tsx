import Link from "next/link";
import { Card } from "@/components/ui";
import { Footer, Header } from "@/components/nav";

const LAYANAN_PREVIEW = [
  { name: "Poli Umum", jam: "08.00 - 16.00" },
  { name: "Poli KIA", jam: "08.00 - 14.00" },
  { name: "Poli Gigi", jam: "08.00 - 13.00" },
  { name: "Laboratorium", jam: "08.00 - 15.00" },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 py-10">
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 inline-flex items-center rounded-full bg-emerald-100 px-4 py-1 text-sm font-bold text-emerald-800">
            Selamat datang di
          </span>
          <h1 className="text-4xl font-extrabold leading-tight text-emerald-900 md:text-5xl">
            Klinik Pratama
            <br />
            Rawat Inap Sahaduta
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            Melayani pendaftaran dan antrean pasien dengan proses yang sederhana,
            cepat, dan mudah digunakan oleh semua kelompok usia.
          </p>
        </div>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {LAYANAN_PREVIEW.map((layanan) => (
            <Card key={layanan.name} className="flex items-center justify-between px-5 py-4">
              <span className="text-lg font-bold text-slate-800">{layanan.name}</span>
              <span className="text-sm text-slate-500">{layanan.jam}</span>
            </Card>
          ))}
        </div>

        <div className="mt-6 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center text-base text-emerald-900">
          Jam Operasional Klinik: <strong>08.00 - 16.00</strong>
        </div>

        <Link
          href="/pendaftaran"
          className="mt-10 w-full max-w-md rounded-2xl bg-emerald-700 px-6 py-5 text-center text-2xl font-extrabold tracking-wide text-white shadow-lg hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-300"
        >
          Ambil Nomor Antrean
        </Link>
      </main>
      <Footer />
    </>
  );
}