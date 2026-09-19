import { AdminShell } from "../AdminShell";
import { ScheduleMatrix } from "../ScheduleMatrix";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default async function AdminJadwalPage() {
  await guardAdmin();

  const staffList = await prisma.staff.findMany({
    include: { service: true, schedules: true },
    orderBy: { serviceId: "asc" },
  });

  const rows = staffList.map((staff) => {
    const byDay: Record<string, { id: number; start: string; end: string }[]> = {};
    for (const day of DAYS) byDay[day] = [];
    for (const schedule of staff.schedules) {
      (byDay[schedule.day] ??= []).push({
        id: schedule.id,
        start: schedule.startTime,
        end: schedule.endTime,
      });
    }
    return {
      id: staff.id,
      name: staff.name,
      type: staff.type,
      serviceId: staff.serviceId,
      serviceName: staff.service.name,
      byDay,
    };
  });

  return (
    <AdminShell>
      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Klik <strong>+ Tambah</strong> pada hari kosong untuk mengisi jadwal, atau klik tanda{" "}
        <strong>&times;</strong> pada jam jaga untuk menghapus. Saat mengisi, bisa sekaligus
        disalin ke <strong>Senin&ndash;Jumat</strong> atau <strong>semua hari</strong>.
      </div>
      <ScheduleMatrix staff={rows} />
    </AdminShell>
  );
}