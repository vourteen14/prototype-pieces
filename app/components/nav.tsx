import Link from "next/link";
import { Brand } from "@/components/Brand";
import { logout } from "@/actions/auth";
import { currentUser } from "@/lib/auth";

export async function Header() {
  const user = await currentUser();

  return (
    <header className="w-full border-b border-blue-100 bg-white">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Brand />

        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-600 md:text-sm">
          <Link href="/layanan" className="hover:text-emerald-700">
            Pilih Layanan
          </Link>
          <Link href="/petugas" className="hover:text-emerald-700">
            Dashboard Petugas
          </Link>
          <Link href="/admin" className="hover:text-emerald-700">
            Admin
          </Link>
        </nav>
      </div>

      {user ? (
        <div className="border-t border-emerald-100 bg-emerald-50">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm">
            <span className="font-semibold text-emerald-900">
              {user.name} <span className="font-normal text-emerald-700">({user.role})</span>
            </span>
            <form action={logout}>
              <button type="submit" className="font-bold text-emerald-800 hover:underline">
                Keluar
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-emerald-100 bg-white py-4 text-center text-sm text-slate-500">
      Klinik Pratama Rawat Inap Sahaduta &middot; Prototype Sistem Pendaftaran dan Antrean Pasien
    </footer>
  );
}