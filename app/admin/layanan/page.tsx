import { AdminShell } from "../AdminShell";
import { LayananManager } from "../LayananManager";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayananPage() {
  await guardAdmin();

  const services = await prisma.service.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, code: true, openingTime: true, closingTime: true, isActive: true },
  });

  return (
    <AdminShell>
      <LayananManager services={services} />
    </AdminShell>
  );
}