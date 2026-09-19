"use client";

import { useRef, useState, useTransition } from "react";
import { hapusJadwal, tambahJadwal } from "@/actions/admin";

type Shift = { id: number; start: string; end: string };
export type RosterStaff = {
  id: number;
  name: string;
  type: string;
  serviceId: number;
  serviceName: string;
  byDay: Record<string, Shift[]>;
};

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const PRESETS: { label: string; start: string; end: string }[] = [
  { label: "Pagi", start: "08:00", end: "12:00" },
  { label: "Siang", start: "12:00", end: "16:00" },
  { label: "Full", start: "08:00", end: "16:00" },
];

type Editor = {
  staff: RosterStaff;
  day: string;
};

export function ScheduleMatrix({ staff }: { staff: RosterStaff[] }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("12:00");
  const [apply, setApply] = useState("CUSTOM");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const openEditor = (staff: RosterStaff, day: string) => {
    setStart("08:00");
    setEnd("12:00");
    setApply("CUSTOM");
    setEditor({ staff, day });
  };

  const save = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    startTransition(async () => {
      await tambahJadwal(data);
      setEditor(null);
    });
  };

  const grouped = staff.reduce<Record<string, RosterStaff[]>>((acc, row) => {
    (acc[row.serviceName] ??= []).push(row);
    return acc;
  }, {});

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] rounded-2xl border border-slate-200 bg-white text-sm shadow-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left font-bold">
                Dokter / Petugas
              </th>
              {SHORT.map((day) => (
                <th key={day} className="px-3 py-3 text-center font-bold">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(grouped).map(([serviceName, rows]) => (
              <>
                <tr>
                  <td
                    colSpan={8}
                    className="bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-800"
                  >
                    {serviceName}
                  </td>
                </tr>
                {rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 hover:bg-slate-50">
                      <p className="font-bold text-slate-900">{row.name}</p>
                      <p className="text-xs text-slate-500">{row.type}</p>
                    </td>
                    {DAYS.map((day) => {
                      const shifts = row.byDay[day] ?? [];
                      return (
                        <td key={day} className="px-1.5 py-1.5 align-top">
                          <div className="flex min-h-[44px] flex-col gap-1">
                            {shifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="group flex items-center justify-between gap-1 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900"
                              >
                                <span>
                                  {shift.start}&ndash;{shift.end}
                                </span>
                                <form action={hapusJadwal}>
                                  <input type="hidden" name="id" value={shift.id} />
                                  <button
                                    type="submit"
                                    title="Hapus shift ini"
                                    className="text-emerald-500 hover:text-red-600"
                                  >
                                    &times;
                                  </button>
                                </form>
                              </div>
                            ))}
                            {shifts.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => openEditor(row, day)}
                                className="rounded-lg border border-dashed border-slate-300 px-2 py-1 text-xs font-semibold text-slate-400 hover:border-emerald-400 hover:text-emerald-700"
                              >
                                + Tambah
                              </button>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {Object.entries(grouped).map(([serviceName, rows]) => (
          <div key={serviceName}>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-emerald-800">
              {serviceName}
            </p>
            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                    <p className="font-bold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.type}</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {DAYS.map((day, index) => {
                      const shifts = row.byDay[day] ?? [];
                      return (
                        <div
                          key={day}
                          className="flex items-center justify-between gap-3 px-4 py-2"
                        >
                          <span className="w-9 shrink-0 text-xs font-bold uppercase text-slate-500">
                            {SHORT[index]}
                          </span>
                          <div className="flex flex-1 flex-wrap justify-end gap-1.5">
                            {shifts.map((shift) => (
                              <span
                                key={shift.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900"
                              >
                                {shift.start}&ndash;{shift.end}
                                <form action={hapusJadwal} className="inline">
                                  <input type="hidden" name="id" value={shift.id} />
                                  <button
                                    type="submit"
                                    title="Hapus shift ini"
                                    className="text-emerald-500 hover:text-red-600"
                                  >
                                    &times;
                                  </button>
                                </form>
                              </span>
                            ))}
                            {shifts.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => openEditor(row, day)}
                                className="rounded-lg border border-dashed border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-400 hover:border-emerald-400 hover:text-emerald-700"
                              >
                                + Tambah
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {staff.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Belum ada dokter / petugas.
          </p>
        ) : null}
      </div>

      {editor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-extrabold text-slate-900">{editor.staff.name}</h3>
              <p className="text-sm text-slate-500">
                {editor.staff.serviceName} &middot; {editor.day}
              </p>
            </div>

            <form ref={formRef} className="space-y-4">
              <input type="hidden" name="staffId" value={editor.staff.id} />
              <input type="hidden" name="serviceId" value={editor.staff.serviceId} />
              <input type="hidden" name="day" value={editor.day} />
              <input type="hidden" name="apply" value={apply} />

              <div>
                <p className="mb-1 text-sm font-bold text-slate-800">Prinsip Jam</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setStart(preset.start);
                        setEnd(preset.end);
                      }}
                      className={`rounded-lg border-2 px-3 py-1.5 text-sm font-bold transition ${
                        start === preset.start && end === preset.end
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-slate-300 text-slate-700 hover:border-emerald-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-800">Mulai</label>
                  <input
                    type="time"
                    name="startTime"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-800">Selesai</label>
                  <input
                    type="time"
                    name="endTime"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-slate-800">Terapkan ke</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "CUSTOM", label: `Hari ini (${SHORT[DAYS.indexOf(editor.day)]})` },
                    { value: "WEEKDAY", label: "Senin–Jumat" },
                    { value: "ALL", label: "Semua hari" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setApply(opt.value)}
                      className={`rounded-full border-2 px-3 py-1 text-xs font-bold transition ${
                        apply === opt.value
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-slate-300 text-slate-600 hover:border-emerald-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="flex-1 rounded-2xl border-2 border-slate-300 px-4 py-3 font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={save}
                disabled={isPending}
                className="flex-1 rounded-2xl bg-emerald-700 px-4 py-3 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}