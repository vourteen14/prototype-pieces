import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Footer, Header } from "@/components/nav";
import { BigButton, Card, ServiceStatusBadge, StepHeader } from "@/components/ui";
import { ambilAntrean } from "@/actions/pasien";
import { prisma } from "@/lib/prisma";
import { getNextSchedule, getOnDutyStaff } from "@/lib/queue";
import { getActiveQueue } from "@/lib/queue-cookie";
import { serviceStatus } from "@/lib/time";
import { guardPatientArea } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LayananDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await guardPatientArea();

  const activeQueue = await getActiveQueue();
  if (activeQueue) {
    redirect(`/antrean/${activeQueue.id}`);
  }

  const { serviceId: serviceIdParam } = await params;
  const { error } = await searchParams;
  const serviceId = Number(serviceIdParam);

  const cookieStore = await cookies();
  const patientId = Number(cookieStore.get("patientId")?.value);

  if (!patientId) {
    redirect("/pendaftaran");
  }

  const [patient, service] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
  ]);

  if (!patient) {
    redirect("/pendaftaran");
  }

  if (!service || !service.isActive) {
    redirect("/layanan");
  }

  const status = serviceStatus(service.openingTime, service.closingTime);
  const open = status === "BUKA";
  const onDuty = open ? await getOnDutyStaff(serviceId) : null;
  const nextSchedule = open && !onDuty ? await getNextSchedule(serviceId) : null;

  const closedMessages: Record<string, { title: string; body: string }> = {
    BELUM_BUKA: {
      title: `${service.name} belum buka.`,
      body: `Jam pelayanan: ${service.openingTime} - ${service.closingTime}. Silakan kembali pada jam pelayanan.`,
    },
    TUTUP: {
      title: `Pelayanan ${service.name} telah selesai.`,
      body: `Jam pelayanan: ${service.openingTime} - ${service.closingTime}. Nomor antrean tidak dapat diambil pada layanan ini.`,
    },
  };

  const failedValidation = error === "tutup";

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10">
        <StepHeader
          step="Langkah 2 dari 3"
          title={service.name}
          sub={`Jam pelayanan: ${service.openingTime} - ${service.closingTime}`}
        />

        {!open ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <ServiceStatusBadge status={status} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {closedMessages[status]?.title ?? "Layanan tidak tersedia."}
            </h2>
            <p className="mt-2 text-slate-600">{closedMessages[status]?.body}</p>
            <Link
              href="/layanan"
              className="mt-6 inline-block rounded-2xl border-2 border-emerald-700 px-6 py-3 text-lg font-bold text-emerald-700 hover:bg-emerald-50"
            >
              Kembali ke Pilih Layanan
            </Link>
          </Card>
        ) : (
          <>
            {failedValidation ? (
              <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">
                Jadwal layanan sudah berubah. Layanan ini tidak dapat diambil saat ini.
              </p>
            ) : null}

            <Card className="mb-6 p-6">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Dokter / Petugas Bertugas</h2>

              {onDuty ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div>
                    <p className="text-lg font-bold text-emerald-900">{onDuty.name}</p>
                    <p className="text-sm text-emerald-700">{onDuty.type}</p>
                  </div>
                  <ServiceStatusBadge status="BUKA" />
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="font-bold text-amber-900">Belum ada dokter bertugas saat ini.</p>
                  {nextSchedule ? (
                    <p className="mt-1 text-sm text-amber-800">
                      Jadwal berikutnya: {nextSchedule.staff.name} ({nextSchedule.startTime} - {nextSchedule.endTime})
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-amber-800">Anda tetap dapat mengambil nomor antrean.</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-bold text-slate-900">Konfirmasi Pendaftaran</h2>
              <dl className="space-y-2 text-base">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Nama</dt>
                  <dd className="text-right font-bold text-slate-900">{patient.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Layanan</dt>
                  <dd className="font-bold text-slate-900">{service.name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Dokter / Petugas</dt>
                  <dd className="text-right font-bold text-slate-900">
                    {onDuty?.name ?? "Belum ada (jadwal berikutnya)"}
                  </dd>
                </div>
              </dl>

              <form action={ambilAntrean} className="mt-6">
                <input type="hidden" name="serviceId" value={service.id} />
                <BigButton>AMBIL NOMOR ANTREAN</BigButton>
              </form>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}