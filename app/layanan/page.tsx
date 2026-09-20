import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, ServiceStatusBadge, StepHeader } from "@/components/ui";
import { Footer, Header } from "@/components/nav";
import { prisma } from "@/lib/prisma";
import { guardPatientArea } from "@/lib/auth";
import { getActiveQueue } from "@/lib/queue-cookie";
import { serviceStatus, todayDayName } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function LayananPage() {
  await guardPatientArea();

  const activeQueue = await getActiveQueue();
  if (activeQueue) {
    redirect(`/antrean/${activeQueue.id}`);
  }

  const cookieStore = await cookies();
  const patientId = cookieStore.get("patientId")?.value;

  if (!patientId) {
    redirect("/pendaftaran");
  }

  const today = todayDayName();

  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      staff: {
        include: {
          schedules: { where: { day: today }, orderBy: { startTime: "asc" } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { id: "asc" },
  });

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
        <StepHeader
          step="Langkah 2 dari 3"
          title="Pilih Layanan / Poli"
          sub={`Hari ini: ${today}. Klik layanan untuk melihat detail dan mengambil nomor antrean.`}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const status = serviceStatus(service.openingTime, service.closingTime);
            const onDutyToday = service.staff.flatMap((s) =>
              s.schedules.map((schedule) => ({
                name: s.name,
                type: s.type,
                start: schedule.startTime,
                end: schedule.endTime,
              })),
            );

            return (
              <Link href={`/layanan/${service.id}`} key={service.id}>
                <Card className="flex h-full flex-col justify-between px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-900">{service.name}</h2>
                    <ServiceStatusBadge status={status} />
                  </div>
                  <div>
                    <div className="mt-3 text-sm text-slate-500">
                      Jam: {service.openingTime} - {service.closingTime}
                    </div>
                    {onDutyToday.length > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Jaga hari ini
                        </span>
                        {onDutyToday.map((duty) => (
                          <span
                            key={`${duty.name}-${duty.start}`}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800"
                          >
                            {duty.name} · {duty.start}&ndash;{duty.end}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs font-semibold text-amber-700">
                        Belum ada jadwal jaga hari ini — Anda tetap bisa mengambil nomor antrean.
                      </p>
                    )}
                    <p className="mt-3 text-sm font-bold text-emerald-700">Pilih →</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Jam pelayanan di atas merupakan data dummy untuk keperluan prototype.
        </p>
      </main>
      <Footer />
    </>
  );
}