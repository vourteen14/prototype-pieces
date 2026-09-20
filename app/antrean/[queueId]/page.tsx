import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Card, QueueStatusBadge } from "@/components/ui";
import { Footer, Header } from "@/components/nav";
import { prisma } from "@/lib/prisma";
import { guardPatientArea } from "@/lib/auth";
import { estimateWaitMinutes, getWaitingCount } from "@/lib/queue";

export const dynamic = "force-dynamic";

export default async function AntreanPage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  await guardPatientArea();

  const { queueId: queueIdParam } = await params;
  const queueId = Number(queueIdParam);

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      patient: true,
      service: true,
      staff: true,
    },
  });

  if (!queue) notFound();

  const waitingAhead = await getWaitingCount(queue.serviceId, queue.id);
  const estimate = estimateWaitMinutes(waitingAhead);

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10">
        <Card className="overflow-hidden text-center">
          <div className="bg-emerald-700 px-6 py-5">
            <p className="text-lg font-bold uppercase tracking-wide text-emerald-100">
              Pendaftaran Berhasil
            </p>
          </div>

          <div className="px-6 py-8">
            <p className="text-sm font-semibold text-slate-500">Nomor Antrean</p>
            <p className="mt-1 text-7xl font-extrabold tracking-tight text-emerald-700">
              {queue.queueNumber}
            </p>

            <div className="mx-auto mt-6 max-w-xs space-y-2 text-left text-base">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Nama</span>
                <span className="font-bold text-slate-900">{queue.patient.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Layanan</span>
                <span className="font-bold text-slate-900">{queue.service.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Dokter / Petugas</span>
                <span className="text-right font-bold text-slate-900">
                  {queue.staff ? queue.staff.name : "Belum ada"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Status</span>
                <QueueStatusBadge status={queue.status} />
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Estimasi waktu tunggu</span>
                <span className="font-bold text-slate-900">± {estimate} menit</span>
              </div>
            </div>

            <p className="mt-8 text-lg font-semibold text-slate-700">
              Silakan menunggu hingga nomor antrean Anda dipanggil.
            </p>

            <AutoRefresh />

            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl border-2 border-emerald-700 px-6 py-3 text-lg font-bold text-emerald-700 hover:bg-emerald-50"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </Card>
      </main>
      <Footer />
    </>
  );
}