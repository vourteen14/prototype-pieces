"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ALLOWED_ACTIONS = ["DIPANGGIL", "DILAYANI", "SELESAI", "BATAL"] as const;

export async function aksiAntrean(formData: FormData) {
  const queueId = Number(formData.get("queueId"));
  const aksi = String(formData.get("aksi"));

  if (!queueId || !ALLOWED_ACTIONS.includes(aksi as (typeof ALLOWED_ACTIONS)[number])) {
    return;
  }

  await prisma.queue.update({
    where: { id: queueId },
    data: { status: aksi },
  });

  revalidatePath("/petugas");
}