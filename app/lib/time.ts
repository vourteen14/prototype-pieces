const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const QUEUE_STATUS = ["MENUNGGU", "DIPANGGIL", "DILAYANI", "SELESAI", "BATAL"] as const;
export type QueueStatus = (typeof QUEUE_STATUS)[number];

// Timezone klinik — semua logika waktu (status poli, nama hari, batas "antrean
// hari ini") memakai zona ini, bukan zona host/server. Bisa di-override via env.
const CLINIC_TZ = process.env.CLINIC_TZ ?? "Asia/Jakarta";

type ClinicClock = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

function clinicClock(): ClinicClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function nowTime(): string {
  const c = clinicClock();
  return `${c.hour}:${c.minute}`;
}

export function todayDayName(): string {
  const c = clinicClock();
  const dayOfWeek = new Date(`${c.year}-${c.month}-${c.day}T00:00:00.000Z`).getUTCDay();
  return DAY_NAMES[dayOfWeek];
}

export type ServiceStatus = "BUKA" | "BELUM_BUKA" | "TUTUP";

export function serviceStatus(openingTime: string, closingTime: string): ServiceStatus {
  const now = nowTime();
  if (now < openingTime) return "BELUM_BUKA";
  if (now > closingTime) return "TUTUP";
  return "BUKA";
}

export const STATUS_LABEL: Record<ServiceStatus, string> = {
  BUKA: "Buka",
  BELUM_BUKA: "Belum Buka",
  TUTUP: "Tutup",
};

export const QUEUE_STATUS_LABEL: Record<QueueStatus, string> = {
  MENUNGGU: "Menunggu",
  DIPANGGIL: "Dipanggil",
  DILAYANI: "Sedang Dilayani",
  SELESAI: "Selesai",
  BATAL: "Dibatalkan",
};

// Offset UTC (dalam ms) dari timezone klinik pada suatu instant tertentu.
function tzOffsetMs(date: Date): number {
  const asUTC = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const asTZ = new Date(date.toLocaleString("en-US", { timeZone: CLINIC_TZ }));
  return asTZ.getTime() - asUTC.getTime();
}

export function startOfToday(): Date {
  const c = clinicClock();
  const asUTC = new Date(`${c.year}-${c.month}-${c.day}T00:00:00.000Z`);
  return new Date(asUTC.getTime() - tzOffsetMs(asUTC));
}

export function endOfToday(): Date {
  const c = clinicClock();
  const asUTC = new Date(`${c.year}-${c.month}-${c.day}T23:59:59.999Z`);
  return new Date(asUTC.getTime() - tzOffsetMs(asUTC));
}

export function generateQueueNumber(code: string, sequence: number): string {
  return `${code}-${String(sequence).padStart(3, "0")}`;
}

export function formatTime(input: string): string {
  return input;
}