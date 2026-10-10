"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// Dipakai hanya saat admin tidak mengisi kata sandi manual. Dibuat acak per
// akun (bukan nilai tetap) supaya tidak jadi kredensial yang mudah ditebak,
// lalu ditampilkan sekali ke admin lewat nilai balik aksi ini.
function generateDokterPassword(): string {
  return randomBytes(6).toString("base64url");
}

export async function tambahLayanan(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const openingTime = String(formData.get("openingTime") ?? "");
  const closingTime = String(formData.get("closingTime") ?? "");

  if (!name || !code || !openingTime || !closingTime) return;

  await prisma.service.create({
    data: { name, code, openingTime, closingTime, isActive: true },
  });

  revalidatePath("/admin");
}

export async function editLayanan(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const openingTime = String(formData.get("openingTime") ?? "");
  const closingTime = String(formData.get("closingTime") ?? "");

  if (!id || !name || !code || !openingTime || !closingTime) return;

  await prisma.service.update({
    where: { id },
    data: { name, code, openingTime, closingTime },
  });

  revalidatePath("/admin/layanan");
}

export async function toggleLayanan(formData: FormData) {
  const id = Number(formData.get("id"));
  const isActive = formData.get("isActive") === "true";

  await prisma.service.update({
    where: { id },
    data: { isActive: !isActive },
  });

  revalidatePath("/admin");
}

export async function hapusLayanan(formData: FormData) {
  const id = Number(formData.get("id"));

  // Akun login dokter yang terhubung ke staff layanan ini juga dihapus,
  // supaya tidak ada kredensial yang nganggur setelah staff-nya hilang.
  const staffWithUser = await prisma.staff.findMany({
    where: { serviceId: id, userId: { not: null } },
    select: { userId: true },
  });

  await prisma.queue.deleteMany({ where: { serviceId: id } });
  await prisma.schedule.deleteMany({ where: { serviceId: id } });
  await prisma.staff.deleteMany({ where: { serviceId: id } });
  await prisma.service.delete({ where: { id } });

  const userIds = staffWithUser.map((s) => s.userId).filter((v): v is number => v !== null);
  if (userIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  revalidatePath("/admin");
}

export async function tambahStaff(formData: FormData): Promise<{ generatedPassword?: string }> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const serviceId = Number(formData.get("serviceId"));
  const loginUsername = String(formData.get("loginUsername") ?? "").trim();
  const loginPassword = String(formData.get("loginPassword") ?? "");

  if (!name || !type || !serviceId) return {};

  if (loginUsername) {
    const generatedPassword = loginPassword ? undefined : generateDokterPassword();
    const user = await prisma.user.create({
      data: {
        name,
        username: loginUsername,
        passwordHash: await bcrypt.hash(loginPassword || generatedPassword!, 10),
        role: "DOKTER",
      },
    });

    await prisma.staff.create({
      data: { name, type, serviceId, userId: user.id },
    });

    revalidatePath("/admin");
    return generatedPassword ? { generatedPassword } : {};
  }

  await prisma.staff.create({ data: { name, type, serviceId } });

  revalidatePath("/admin");
  return {};
}

export async function editStaff(formData: FormData): Promise<{ generatedPassword?: string }> {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const serviceId = Number(formData.get("serviceId"));
  const loginUsername = String(formData.get("loginUsername") ?? "").trim();
  const loginPassword = String(formData.get("loginPassword") ?? "");

  if (!id || !name || !type || !serviceId) return {};

  const current = await prisma.staff.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!current) return {};

  let generatedPassword: string | undefined;

  if (loginUsername) {
    let userId = current.userId;
    if (current.userId) {
      await prisma.user.update({
        where: { id: current.userId },
        data: {
          name,
          username: loginUsername,
          ...(loginPassword ? { passwordHash: await bcrypt.hash(loginPassword, 10) } : {}),
        },
      });
    } else {
      generatedPassword = loginPassword ? undefined : generateDokterPassword();
      const user = await prisma.user.create({
        data: {
          name,
          username: loginUsername,
          passwordHash: await bcrypt.hash(loginPassword || generatedPassword!, 10),
          role: "DOKTER",
        },
      });
      userId = user.id;
    }

    await prisma.staff.update({ where: { id }, data: { name, type, serviceId, userId } });
  } else {
    if (current.userId) {
      await prisma.user.delete({ where: { id: current.userId } });
    }
    await prisma.staff.update({ where: { id }, data: { name, type, serviceId } });
  }

  revalidatePath("/admin/staff");
  return generatedPassword ? { generatedPassword } : {};
}

export async function hapusStaff(formData: FormData) {
  const id = Number(formData.get("id"));

  const staff = await prisma.staff.findUnique({ where: { id }, select: { userId: true } });
  if (staff?.userId) {
    await prisma.user.delete({ where: { id: staff.userId } });
  }

  await prisma.schedule.deleteMany({ where: { staffId: id } });
  await prisma.staff.delete({ where: { id } });

  revalidatePath("/admin");
}

export async function tambahJadwal(formData: FormData) {
  const staffId = Number(formData.get("staffId"));
  const serviceId = Number(formData.get("serviceId"));
  const day = String(formData.get("day") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const apply = String(formData.get("apply") ?? "");

  const targets =
    apply === "ALL"
      ? DAYS
      : apply === "WEEKDAY"
        ? DAYS.slice(0, 5)
        : apply === "CUSTOM"
          ? [day]
          : [];

  if (
    !staffId ||
    !serviceId ||
    targets.length === 0 ||
    !targets.every((d) => DAYS.includes(d)) ||
    !startTime ||
    !endTime
  ) {
    return;
  }

  await prisma.schedule.createMany({
    data: targets.map((targetDay) => ({
      staffId,
      serviceId,
      day: targetDay,
      startTime,
      endTime,
    })),
  });

  revalidatePath("/admin/jadwal");
}

export async function hapusJadwal(formData: FormData) {
  const id = Number(formData.get("id"));

  await prisma.schedule.delete({ where: { id } });

  revalidatePath("/admin");
}