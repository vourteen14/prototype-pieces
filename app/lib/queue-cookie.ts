import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const QUEUE_COOKIE = "queueId";
const PATIENT_COOKIE = "patientId";
const PATIENT_SECRET = process.env.SESSION_SECRET ?? "klinik-sahaduta-dev-secret";
const PATIENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function signPatientId(patientId: number): string {
  const payload = String(patientId);
  const signature = createHmac("sha256", PATIENT_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

// Cookie "patientId" ditandatangani (HMAC) agar tidak bisa dipalsukan lewat
// devtools, karena nilainya dipakai sebagai dasar otorisasi untuk melihat
// status antrean milik pasien yang bersangkutan.
export async function setPatientIdCookie(patientId: number): Promise<void> {
  const store = await cookies();
  store.set(PATIENT_COOKIE, signPatientId(patientId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: PATIENT_COOKIE_MAX_AGE,
  });
}

export async function getPatientId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(PATIENT_COOKIE)?.value;
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", PATIENT_SECRET).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  const patientId = Number(payload);
  return patientId > 0 ? patientId : null;
}

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
  const patientId = await getPatientId();

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