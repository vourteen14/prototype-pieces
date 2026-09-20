"use client";

import { useEffect } from "react";

const REFRESH_MS = 15_000;

// Segarkan halaman tiket secara berkala agar status antrean (dipanggil,
// dilayani, dll.) selalu ter-update tanpa harus reload manual. Dihentikan
// saat tab tidak terlihat untuk hemat sumber daya.
export function AutoRefresh() {
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        window.location.reload();
      }
    };
    const timer = setInterval(tick, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-500">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
      Halaman ini disegarkan otomatis tiap 15 detik
    </p>
  );
}