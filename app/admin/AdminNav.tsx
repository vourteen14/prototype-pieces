"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/layanan", label: "Poli / Layanan" },
  { href: "/admin/staff", label: "Dokter / Petugas" },
  { href: "/admin/jadwal", label: "Jadwal Bertugas" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-bold transition ${
              active
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}