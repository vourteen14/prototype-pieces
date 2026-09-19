import type { ReactNode } from "react";
import { Footer, Header } from "@/components/nav";
import { AdminNav } from "./AdminNav";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Manajemen Data Klinik</h1>
          <p className="text-slate-500">
            Kelola layanan, dokter/petugas, dan jadwal bertugas.
          </p>
        </div>
        <AdminNav />
        {children}
      </main>
      <Footer />
    </>
  );
}