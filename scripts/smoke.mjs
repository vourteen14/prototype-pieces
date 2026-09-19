import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const [patient, service, staff] = await Promise.all([
    prisma.patient.create({ data: { name: "Budi Santoso", nik: "327xxxxxxxxxxxxx" } }),
    prisma.service.findFirstOrThrow({ where: { name: "Poli Umum" } }),
    prisma.staff.findFirstOrThrow({ where: { name: "dr. Andi Pratama" } }),
  ]);

  const todayCount = await prisma.queue.count({
    where: {
      serviceId: service.id,
      queueDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const queue = await prisma.queue.create({
    data: {
      queueNumber: `${service.code}-${String(todayCount + 1).padStart(3, "0")}`,
      patientId: patient.id,
      serviceId: service.id,
      staffId: staff.id,
      queueDate: new Date(),
      status: "MENUNGGU",
    },
  });

  console.log(JSON.stringify({ patientId: patient.id, queueId: queue.id, queueNumber: queue.queueNumber, serviceId: service.id }));
}

main().finally(async () => prisma.$disconnect());