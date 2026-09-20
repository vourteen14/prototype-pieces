import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clearQueueCookie } from "@/lib/queue-cookie";
import { endOfToday, startOfToday } from "@/lib/time";

export const dynamic = "force-dynamic";

// Endpoint status antrean untuk polling halaman tiket. Sekaligus membuang
// cookie queueId begitu antrean berstatus SELESAI / BATAL sehingga pasien
// kembali ke beranda saat membuka aplikasi lagi.
export async function GET(request: Request) {
  const queueId = Number(new URL(request.url).searchParams.get("queueId"));
  const store = await cookies();
  const patientId = Number(store.get("patientId")?.value);

  if (!queueId || !patientId) {
    return NextResponse.json({ error: "missing_identity" }, { status: 400 });
  }

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { patient: true, service: true, staff: true },
  });

  if (!queue || queue.patientId !== patientId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const base = {
    queueId: queue.id,
    queueNumber: queue.queueNumber,
    serviceName: queue.service.name,
    staffName: queue.staff?.name ?? null,
  };

  if (queue.status === "SELESAI" || queue.status === "BATAL") {
    await clearQueueCookie();
    return NextResponse.json({ ...base, status: queue.status });
  }

  const waitingAhead = await prisma.queue.count({
    where: {
      serviceId: queue.serviceId,
      queueDate: { gte: startOfToday(), lte: endOfToday() },
      status: "MENUNGGU",
      id: { not: queue.id },
    },
  });

  return NextResponse.json({
    ...base,
    status: queue.status,
    waitingAhead,
    estimate: waitingAhead * 10,
  });
}