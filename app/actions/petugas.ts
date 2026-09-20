"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { endOfToday, startOfToday } from "@/lib/time";

const ALLOWED_ACTIONS = ["DIPANGGIL", "DILAYANI", "SELESAI", "BATAL"] as const;
type Aksi = (typeof ALLOWED_ACTIONS)[number];

// Transisi status yang sah: petugas/dokter tidak boleh melompati tahapan.
const ALLOWED_FROM: Record<Aksi, string[]> = {
  DIPANGGIL: ["MENUNGGU"],
  DILAYANI: ["DIPANGGIL"],
  SELESAI: ["DILAYANI"],
  BATAL: ["MENUNGGU", "DIPANGGIL"],
};

// Kemajuan antrean:
// - Petugas (front desk): Panggil, Layani, Batal (semua poli).
// - Dokter: hanya "Selesai" untuk antrean poli miliknya.
// - Saat antrean selesai, pasien berikutnya pada poli yang sama otomatis
//   dipanggil sehingga alur berjalan tanpa klik tambahan.
export async function aksiAntrean(formData: FormData) {
  const queueId = Number(formData.get("queueId"));
  const aksiRaw = String(formData.get("aksi"));
  if (!queueId || !ALLOWED_ACTIONS.includes(aksiRaw as Aksi)) return;
  const aksi = aksiRaw as Aksi;

  const user = await currentUser();
  if (!user) return;

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    select: { id: true, serviceId: true, status: true },
  });
  if (!queue) return;

  // Hak akses berdasarkan role.
  if (user.role === "DOKTER") {
    if (aksi !== "SELESAI") return;
    const staff = await prisma.staff.findUnique({
      where: { userId: user.id },
      select: { serviceId: true },
    });
    if (!staff || staff.serviceId !== queue.serviceId) return;
  } else if (user.role !== "PETUGAS" && user.role !== "ADMIN") {
    return;
  }

  if (!ALLOWED_FROM[aksi].includes(queue.status)) return;

  await prisma.queue.update({
    where: { id: queue.id },
    data: { status: aksi },
  });

  // Auto-call pasien berikutnya pada poli yang sama (antrean hari ini).
  if (aksi === "SELESAI") {
    const next = await prisma.queue.findFirst({
      where: {
        serviceId: queue.serviceId,
        status: "MENUNGGU",
        queueDate: { gte: startOfToday(), lte: endOfToday() },
      },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    if (next) {
      await prisma.queue.update({
        where: { id: next.id },
        data: { status: "DIPANGGIL" },
      });
    }
  }

  revalidatePath("/petugas");
  revalidatePath("/dokter");
}