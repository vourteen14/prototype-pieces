"use client";

import { useState, useTransition } from "react";
import { editStaff, hapusStaff, tambahStaff } from "@/actions/admin";
import { Modal } from "@/components/Modal";
import { Field, SelectInput, TextInput } from "@/components/form";

export type StaffRow = {
  id: number;
  name: string;
  type: string;
  serviceId: number;
  serviceName: string;
  schedules: number;
};

export type ServiceOption = { id: number; name: string };

const JENIS = ["Dokter Umum", "Dokter Gigi", "Bidan", "Analis Lab", "Petugas"];

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; id: number; name: string; type: string; serviceId: number }
  | null;

export function StaffManager({
  staff,
  services,
}: {
  staff: StaffRow[];
  services: ServiceOption[];
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState(JENIS[0]);
  const [serviceId, setServiceId] = useState<number | "">("");
  const [pending, startTransition] = useTransition();

  const openCreate = () => {
    setName("");
    setType(JENIS[0]);
    setServiceId(services[0]?.id ?? "");
    setModal({ mode: "create" });
  };

  const openEdit = (row: StaffRow) => {
    setName(row.name);
    setType(row.type);
    setServiceId(row.serviceId);
    setModal({ mode: "edit", id: row.id, name: row.name, type: row.type, serviceId: row.serviceId });
  };

  const save = () => {
    const data = new FormData();
    if (modal?.mode === "edit") data.append("id", String(modal.id));
    data.append("name", name);
    data.append("type", type);
    data.append("serviceId", String(serviceId));

    startTransition(async () => {
      if (modal?.mode === "edit") {
        await editStaff(data);
      } else {
        await tambahStaff(data);
      }
      setModal(null);
    });
  };

  const remove = (row: StaffRow) => {
    if (!window.confirm(`Hapus "${row.name}" beserta jadwalnya?`)) return;
    const data = new FormData();
    data.append("id", String(row.id));
    startTransition(async () => {
      await hapusStaff(data);
    });
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Total {staff.length} dokter / petugas</p>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
        >
          + Tambah Dokter / Petugas
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-bold">Nama</th>
              <th className="px-4 py-3 font-bold">Jenis</th>
              <th className="px-4 py-3 font-bold">Layanan</th>
              <th className="px-4 py-3 font-bold">Jadwal</th>
              <th className="px-4 py-3 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">{row.name}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">{row.serviceName}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
                    {row.schedules} hari jaga
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Belum ada dokter / petugas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

<div className="space-y-3 md:hidden">
        {staff.map((row) => (
          <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-slate-900">{row.name}</p>
                <p className="text-sm text-slate-500">
                  {row.type} &middot; {row.serviceName}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
                {row.schedules} hari jaga
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(row)}
                className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
        {staff.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Belum ada dokter / petugas.
          </p>
        ) : null}
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Dokter / Petugas" : "Tambah Dokter / Petugas"}
      >
        <div className="space-y-4">
          <Field label="Nama Lengkap">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: dr. Budi Santoso" />
          </Field>
          <Field label="Jenis">
            <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
              {JENIS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Layanan">
            <SelectInput value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))}>
              <option value="">-- Pilih Layanan --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectInput>
          </Field>
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
              disabled={pending || !name || !serviceId}
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