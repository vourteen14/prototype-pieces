"use client";

import { useActionState } from "react";
import { daftarPasien } from "@/actions/pasien";
import { BigButton } from "@/components/ui";

export function PendaftaranForm() {
  const [state, formAction, pending] = useActionState(daftarPasien, {});

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="nama" className="mb-1 block text-base font-bold text-slate-800">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          required
          defaultValue={state.nama ?? ""}
          autoComplete="off"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Masukkan nama lengkap"
        />
      </div>

      <div>
        <label htmlFor="nik" className="mb-1 block text-base font-bold text-slate-800">
          NIK (Opsional)
        </label>
        <input
          id="nik"
          name="nik"
          type="text"
          defaultValue={state.nik ?? ""}
          autoComplete="off"
          inputMode="numeric"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-lg focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Boleh dikosongkan"
        />
        <p className="mt-1 text-sm text-slate-500">
          Tidak wajib. Pasien tanpa NIK (misalnya bayi) tetap dapat melanjutkan.
        </p>
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}

      <BigButton disabled={pending}>Lanjutkan</BigButton>
    </form>
  );
}