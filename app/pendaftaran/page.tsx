import { PendaftaranForm } from "@/components/PendaftaranForm";
import { Card, StepHeader } from "@/components/ui";
import { Footer, Header } from "@/components/nav";
import { redirect } from "next/navigation";
import { guardPatientArea } from "@/lib/auth";
import { getActiveQueue } from "@/lib/queue-cookie";

export default async function PendaftaranPage() {
  await guardPatientArea();

  const activeQueue = await getActiveQueue();
  if (activeQueue) {
    redirect(`/antrean/${activeQueue.id}`);
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10">
        <StepHeader
          step="Langkah 1 dari 3"
          title="Pendaftaran Pasien"
          sub="Isi data pendaftaran untuk melanjutkan ke pemilihan layanan."
        />
        <Card className="p-5 sm:p-8">
          <PendaftaranForm />
        </Card>
      </main>
      <Footer />
    </>
  );
}