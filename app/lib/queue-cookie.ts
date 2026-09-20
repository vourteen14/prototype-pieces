import "server-only";

import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const QUEUE_COOKIE = "queueId";

// Cookie antrean dipakai untuk "mengingat" tiket pasien: saat membuka
// aplikasi lagi, pasien langsung diarahkan ke halaman antrean yang masih
// aktif. Cookie dibuang otomatis begitu status mencapai SELESAI / BATAL.
export async function setActiveQueueCookie(queueId: number): Promise<void> {
  const store = await cookies();
  store.set(QUEUE_COOKIE, String(queueId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearQueueCookie(): Promise<void> {
  const store = await cookies();
  store.delete(QUEUE_COOKIE);
}

// Mengambil antrean aktif milik pasien pada perangkat ini berdasarkan cookie.
// Antrean berstatus final (SELESAI/BATAL) atau bukan milik pasien cookie
// dipakai = cookie dihapus dan dikembalikan null.
export async function getActiveQueue(): Promise<{
  id: number;
  status: string;
} | null> {
  const store = await cookies();
  const queueId = Number(store.get(QUEUE_COOKIE)?.value);
  const patientId = Number(store.get("patientId")?.value);

  if (!queueId || !patientId) return null;

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    select: { id: true, status: true, patientId: true },
  });

  if (!queue || queue.patientId !== patientId) {
    await clearQueueCookie();
    return null;
  }

  if (queue.status === "SELESAI" || queue.status === "BATAL") {
    await clearQueueCookie();
    return null;
  }

  return { id: queue.id, status: queue.status };
}