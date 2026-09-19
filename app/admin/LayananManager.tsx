"use client";

import { useState, useTransition } from "react";
import { editLayanan, hapusLayanan, tambahLayanan, toggleLayanan } from "@/actions/admin";
import { Modal } from "@/components/Modal";
import { Field, TextInput, TimeInput } from "@/components/form";

export type ServiceRow = {
  id: number;
  name: string;
  code: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
};

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; id: number; name: string; code: string; openingTime: string; closingTime: string }
  | null;

export function LayananManager({ services }: { services: ServiceRow[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [openingTime, setOpeningTime] = useState("08:00");
  const [closingTime, setClosingTime] = useState("16:00");
  const [pending, startTransition] = useTransition();

  const openCreate = () => {
    setName("");
    setCode("");
    setOpeningTime("08:00");
    setClosingTime("16:00");
    setModal({ mode: "create" });
  };

  const openEdit = (s: ServiceRow) => {
    setName(s.name);
    setCode(s.code);
    setOpeningTime(s.openingTime);
    setClosingTime(s.closingTime);
    setModal({ mode: "edit", id: s.id, name: s.name, code: s.code, openingTime: s.openingTime, closingTime: s.closingTime });
  };

  const save = () => {
    const data = new FormData();
    if (modal?.mode === "edit") data.append("id", String(modal.id));
    data.append("name", name);
    data.append("code", code);
    data.append("openingTime", openingTime);
    data.append("closingTime", closingTime);

    startTransition(async () => {
      if (modal?.mode === "edit") {
        await editLayanan(data);
      } else {
        await tambahLayanan(data);
      }
      setModal(null);
    });
  };

  const toggle = (s: ServiceRow) => {
    const data = new FormData();
    data.append("id", String(s.id));
    data.append("isActive", String(s.isActive));
    startTransition(async () => {
      await toggleLayanan(data);
    });
  };

  const remove = (s: ServiceRow) => {
    if (!window.confirm(`Hapus layanan "${s.name}" beserta staff dan jadwalnya?`)) return;
    const data = new FormData();
    data.append("id", String(s.id));
    startTransition(async () => {
      await hapusLayanan(data);
    });
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Total {services.length} layanan</p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
        >
          + Tambah Layanan
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-bold">Nama</th>
              <th className="px-4 py-3 font-bold">Kode</th>
              <th className="px-4 py-3 font-bold">Jam Pelayanan</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                <td className="px-4 py-3">{s.code}</td>
                <td className="px-4 py-3">
                  {s.openingTime} &ndash; {s.closingTime}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    className={`rounded-full border px-3 py-0.5 text-xs font-bold ${
                      s.isActive
                        ? "border-green-300 bg-green-100 text-green-800"
                        : "border-red-300 bg-red-100 text-red-800"
                    }`}
                  >
                    {s.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Belum ada layanan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {services.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-slate-900">{s.name}</p>
                <p className="text-sm text-slate-500">
                  Kode {s.code} &middot; {s.openingTime} &ndash; {s.closingTime}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(s)}
                className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-bold ${
                  s.isActive
                    ? "border-green-300 bg-green-100 text-green-800"
                    : "border-red-300 bg-red-100 text-red-800"
                }`}
              >
                {s.isActive ? "Aktif" : "Nonaktif"}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(s)}
                className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(s)}
                className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Belum ada layanan.
          </p>
        ) : null}
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Layanan" : "Tambah Layanan"}
      >
        <div className="space-y-4">
          <Field label="Nama Layanan">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Poli Umum" />
          </Field>
          <Field label="Kode Antrean">
            <TextInput value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="A / K / G / L" maxLength={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Buka">
              <TimeInput type="time" value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
            </Field>
            <Field label="Jam Tutup">
              <TimeInput type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="flex-1 rounded-2xl border-2 border-slate-300 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || !name || !code}
              className="flex-1 rounded-2xl bg-emerald-700 px-4 py-2.5 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}