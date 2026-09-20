import { AdminShell } from "../AdminShell";
import { StaffManager } from "../StaffManager";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  await guardAdmin();

  const [services, staffList] = await Promise.all([
    prisma.service.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true } }),
    prisma.staff.findMany({
      include: { service: true, user: { select: { username: true } }, _count: { select: { schedules: true } } },
      orderBy: { serviceId: "asc" },
    }),
  ]);

  const rows = staffList.map((staff) => ({
    id: staff.id,
    name: staff.name,
    type: staff.type,
    serviceId: staff.serviceId,
    serviceName: staff.service.name,
    schedules: staff._count.schedules,
    loginUsername: staff.user?.username ?? null,
  }));

  return (
    <AdminShell>
      <StaffManager staff={rows} services={services} />
    </AdminShell>
  );
}