import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, ServiceStatusBadge, StepHeader } from "@/components/ui";
import { Footer, Header } from "@/components/nav";
import { prisma } from "@/lib/prisma";
import { serviceStatus } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function LayananPage() {
  const cookieStore = await cookies();
  const patientId = cookieStore.get("patientId")?.value;

  if (!patientId) {
    redirect("/pendaftaran");
  }

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
        <StepHeader
          step="Langkah 2 dari 3"
          title="Pilih Layanan / Poli"
          sub="Pilih layanan yang ingin dituju. Nomor antrean hanya dapat diambil pada layanan yang sedang buka."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const status = serviceStatus(service.openingTime, service.closingTime);
            const open = status === "BUKA";

            return (
              <Link href={`/layanan/${service.id}`} key={service.id}>
                <Card
                  className={`flex h-full flex-col justify-between px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-md ${
                    open ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-900">{service.name}</h2>
                    <ServiceStatusBadge status={status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span>
                      Jam: {service.openingTime} - {service.closingTime}
                    </span>
                    <span>{open ? "Pilih →" : "Tidak tersedia"}</span>
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