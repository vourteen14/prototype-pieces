import type { ReactNode } from "react";
import { QueueStatus, ServiceStatus } from "@/lib/time";

export type { ServiceStatus, QueueStatus };

export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const styles: Record<ServiceStatus, string> = {
    BUKA: "bg-green-100 text-green-800 border-green-300",
    BELUM_BUKA: "bg-amber-100 text-amber-800 border-amber-300",
    TUTUP: "bg-red-100 text-red-800 border-red-300",
  };

  const label: Record<ServiceStatus, string> = {
    BUKA: "Buka",
    BELUM_BUKA: "Belum Buka",
    TUTUP: "Tutup",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${styles[status]}`}>
      {label[status]}
    </span>
  );
}

export function QueueStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    MENUNGGU: "bg-slate-100 text-slate-700 border-slate-300",
    DIPANGGIL: "bg-blue-100 text-blue-800 border-blue-300",
    DILAYANI: "bg-amber-100 text-amber-800 border-amber-300",
    SELESAI: "bg-green-100 text-green-800 border-green-300",
    BATAL: "bg-red-100 text-red-800 border-red-300",
  };

  const label: Record<string, string> = {
    MENUNGGU: "Menunggu",
    DIPANGGIL: "Dipanggil",
    DILAYANI: "Sedang Dilayani",
    SELESAI: "Selesai",
    BATAL: "Dibatalkan",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${styles[status] ?? styles.MENUNGGU}`}>
      {label[status] ?? status}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function BigButton({
  children,
  type = "submit",
  disabled,
}: {
  children: ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-2xl bg-emerald-700 px-6 py-4 text-xl font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-emerald-300"
    >
      {children}
    </button>
  );
}

export function StepHeader({ step, title, sub }: { step: string; title: string; sub?: string }) {
  return (
    <header className="mb-6 flex flex-col items-center text-center">
      <span className="mb-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
        {step}
      </span>
      <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">{title}</h1>
      {sub ? <p className="mt-1 text-slate-500">{sub}</p> : null}
    </header>
  );
}