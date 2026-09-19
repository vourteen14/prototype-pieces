const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const QUEUE_STATUS = ["MENUNGGU", "DIPANGGIL", "DILAYANI", "SELESAI", "BATAL"] as const;
export type QueueStatus = (typeof QUEUE_STATUS)[number];

export function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function todayDayName(): string {
  return DAY_NAMES[new Date().getDay()];
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

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function generateQueueNumber(code: string, sequence: number): string {
  return `${code}-${String(sequence).padStart(3, "0")}`;
}

export function formatTime(input: string): string {
  return input;
}