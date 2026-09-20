import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { QueueMonitor } from "@/components/QueueMonitor";
import { Card } from "@/components/ui";
import { Footer, Header } from "@/components/nav";
import { prisma } from "@/lib/prisma";
import { guardPatientArea } from "@/lib/auth";
import { clearQueueCookie } from "@/lib/queue-cookie";

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

  // Antrean sudah selesai/dibatalkan: buang cookie tiket lalu kembali ke
  // beranda agar pasien memulai pendaftaran baru.
  if (queue.status === "SELESAI" || queue.status === "BATAL") {
    const store = await cookies();
    if (Number(store.get("queueId")?.value) === queueId) {
      await clearQueueCookie();
    }
    redirect("/");
  }

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

              <QueueMonitor queueId={queue.id} initialStatus={queue.status} />
            </div>

            <p className="mt-8 text-sm text-slate-400">
              Jika halaman ditutup dan dibuka lagi, Anda akan otomatis kembali ke tiket ini.
            </p>
          </div>
        </Card>
      </main>
      <Footer />
    </>
  );
}