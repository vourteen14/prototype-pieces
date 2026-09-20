import { Footer, Header } from "@/components/nav";
import { Card, QueueStatusBadge } from "@/components/ui";
import { aksiAntrean } from "@/actions/petugas";
import { prisma } from "@/lib/prisma";
import { guardDokter } from "@/lib/auth";
import { endOfToday, startOfToday } from "@/lib/time";

export const dynamic = "force-dynamic";

const summaryCards = [
  { key: "total", label: "Total Antrean", style: "bg-slate-100 text-slate-800" },
  { key: "MENUNGGU", label: "Menunggu", style: "bg-slate-100 text-slate-700" },
  { key: "DILAYANI", label: "Sedang Diperiksa", style: "bg-amber-100 text-amber-800" },
  { key: "SELESAI", label: "Selesai", style: "bg-green-100 text-green-800" },
];

export default async function DokterPage() {
  const { user, staff } = await guardDokter();

  const queues = await prisma.queue.findMany({
    where: {
      serviceId: staff.serviceId,
      status: { not: "BATAL" },
      queueDate: { gte: startOfToday(), lte: endOfToday() },
    },
    include: {
      patient: true,
      service: true,
      staff: true,
    },
    orderBy: { id: "asc" },
  });

  const count = (status?: string) =>
    status ? queues.filter((q) => q.status === status).length : queues.length;

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Dashboard Dokter
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {user.name} &middot; {staff.service.name} &middot; Poli Anda hari ini
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800">
            {staff.service.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.key} className={`px-4 py-4 ${card.style}`}>
              <p className="text-3xl font-extrabold">{count(card.key === "total" ? undefined : card.key)}</p>
              <p className="mt-1 text-sm font-semibold">{card.label}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-0">
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-bold">No</th>
                  <th className="px-4 py-3 font-bold">Nama</th>
                  <th className="px-4 py-3 font-bold">Layanan</th>
                  <th className="px-4 py-3 font-bold">Dokter / Petugas</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queues.map((queue) => (
                  <tr key={queue.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{queue.queueNumber}</td>
                    <td className="px-4 py-3">{queue.patient.name}</td>
                    <td className="px-4 py-3">{queue.service.name}</td>
                    <td className="px-4 py-3">{queue.staff?.name ?? "Belum ada"}</td>
                    <td className="px-4 py-3">
                      <QueueStatusBadge status={queue.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <DoctorActions queue={queue} />
                      </div>
                    </td>
                  </tr>
                ))}
                {queues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Belum ada antrean di poli Anda hari ini.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {queues.map((queue) => (
              <div key={queue.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">{queue.queueNumber}</p>
                    <p className="truncate text-base font-extrabold text-slate-900">
                      {queue.patient.name}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {queue.service.name}
                      <span className="text-slate-400"> &middot; </span>
                      {queue.staff?.name ?? "Belum ada"}
                    </p>
                  </div>
                  <QueueStatusBadge status={queue.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DoctorActions queue={queue} />
                </div>
              </div>
            ))}
            {queues.length === 0 ? (
              <p className="px-4 py-10 text-center text-slate-500">Belum ada antrean di poli Anda hari ini.</p>
            ) : null}
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          Pasien yang selesai diperiksa ditutup statusnya dari sini; pasien berikutnya otomatis dipanggil.
        </p>
      </main>
      <Footer />
    </>
  );
}

function DoctorActions({
  queue,
}: {
  queue: { id: number; status: string };
}) {
  if (queue.status !== "DILAYANI") return null;

  return (
    <form action={aksiAntrean}>
      <input type="hidden" name="queueId" value={queue.id} />
      <input type="hidden" name="aksi" value="SELESAI" />
      <button
        type="submit"
        className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-green-700"
      >
        Selesai
      </button>
    </form>
  );
}