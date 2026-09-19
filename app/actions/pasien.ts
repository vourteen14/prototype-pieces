"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createQueueNumber, getOnDutyStaff } from "@/lib/queue";
import { serviceStatus } from "@/lib/time";

export type DaftarState = {
  nama?: string;
  nik?: string;
  error?: string;
};

export async function daftarPasien(
  _prev: DaftarState,
  formData: FormData,
): Promise<DaftarState> {
  const nama = String(formData.get("nama") ?? "").trim();
  const nik = String(formData.get("nik") ?? "").trim() || null;

  if (!nama) {
    return { nama, nik: nik ?? "", error: "Nama Lengkap wajib diisi." };
  }

  const patient = await prisma.patient.create({
    data: { name: nama, nik },
  });

  const cookieStore = await cookies();
  cookieStore.set("patientId", String(patient.id));

  redirect("/layanan");
}

export async function ambilAntrean(formData: FormData) {
  const serviceId = Number(formData.get("serviceId"));

  const cookieStore = await cookies();
  const patientId = Number(cookieStore.get("patientId")?.value);

  if (!patientId) {
    redirect("/pendaftaran");
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });

  if (!service || !service.isActive) {
    redirect("/layanan");
  }

  const status = serviceStatus(service.openingTime, service.closingTime);
  if (status !== "BUKA") {
    redirect(`/layanan/${serviceId}?error=tutup`);
  }

  const onDuty = await getOnDutyStaff(serviceId);
  const queueNumber = await createQueueNumber(serviceId);

  const queue = await prisma.queue.create({
    data: {
      queueNumber,
      patientId,
      serviceId,
      staffId: onDuty?.id ?? null,
      queueDate: new Date(),
      status: "MENUNGGU",
    },
  });

  redirect(`/antrean/${queue.id}`);
}