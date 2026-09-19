import { Footer, Header } from "@/components/nav";
import { Card, QueueStatusBadge } from "@/components/ui";
import { aksiAntrean } from "@/actions/petugas";
import { prisma } from "@/lib/prisma";
import { guardPetugas } from "@/lib/auth";
import { endOfToday, startOfToday } from "@/lib/time";

export const dynamic = "force-dynamic";

const summaryCards = [
  { key: "total", label: "Total Antrean Hari Ini", style: "bg-slate-100 text-slate-800" },
  { key: "MENUNGGU", label: "Menunggu", style: "bg-slate-100 text-slate-700" },
  { key: "DIPANGGIL", label: "Dipanggil", style: "bg-blue-100 text-blue-800" },
  { key: "DILAYANI", label: "Sedang Dilayani", style: "bg-amber-100 text-amber-800" },
  { key: "SELESAI", label: "Selesai", style: "bg-green-100 text-green-800" },
];

export default async function PetugasPage() {
  await guardPetugas();

  const queues = await prisma.queue.findMany({
    where: {
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
        <h1 className="mb-6 text-2xl font-extrabold text-slate-900">
          Dashboard Petugas
        </h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
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
                  <th className="px-4 py-3 font-bold">Poli</th>
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
                        <QueueActions queue={queue} />
                      </div>
                    </td>
                  </tr>
                ))}
                {queues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Belum ada antrean hari ini.
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
                  <QueueActions queue={queue} />
                </div>
              </div>
            ))}
            {queues.length === 0 ? (
              <p className="px-4 py-10 text-center text-slate-500">Belum ada antrean hari ini.</p>
            ) : null}
          </div>
        </Card>
      </main>
      <Footer />
    </>
  );
}

function QueueActions({
  queue,
}: {
  queue: { id: number; status: string };
}) {
  return (
    <>
      {queue.status === "MENUNGGU" ? (
        <ActionForm queueId={queue.id} aksi="DIPANGGIL" label="Panggil" style="bg-blue-600 hover:bg-blue-700" />
      ) : null}
      {queue.status === "DIPANGGIL" ? (
        <ActionForm queueId={queue.id} aksi="DILAYANI" label="Layani" style="bg-amber-500 hover:bg-amber-600" />
      ) : null}
      {queue.status === "DILAYANI" ? (
        <ActionForm queueId={queue.id} aksi="SELESAI" label="Selesai" style="bg-green-600 hover:bg-green-700" />
      ) : null}
      {queue.status === "MENUNGGU" || queue.status === "DIPANGGIL" ? (
        <ActionForm queueId={queue.id} aksi="BATAL" label="Batal" style="bg-red-600 hover:bg-red-700" />
      ) : null}
    </>
  );
}

function ActionForm({
  queueId,
  aksi,
  label,
  style,
}: {
  queueId: number;
  aksi: "DIPANGGIL" | "DILAYANI" | "SELESAI" | "BATAL";
  label: string;
  style: string;
}) {
  return (
    <form action={aksiAntrean}>
      <input type="hidden" name="queueId" value={queueId} />
      <input type="hidden" name="aksi" value={aksi} />
      <button
        type="submit"
        className={`rounded-lg px-3 py-1.5 text-sm font-bold text-white ${style}`}
      >
        {label}
      </button>
    </form>
  );
}