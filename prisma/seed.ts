import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const services = [
  { name: "Poli Umum", code: "A", openingTime: "08:00", closingTime: "16:00" },
  { name: "Poli KIA", code: "K", openingTime: "08:00", closingTime: "14:00" },
  { name: "Poli Gigi", code: "G", openingTime: "08:00", closingTime: "13:00" },
  { name: "Laboratorium", code: "L", openingTime: "08:00", closingTime: "15:00" },
];

const staffByService: Record<string, { name: string; type: string; start: string; end: string }[]> = {
  "Poli Umum": [
    { name: "dr. Andi Pratama", type: "Dokter Umum", start: "08:00", end: "12:00" },
    { name: "dr. Siti Rahma", type: "Dokter Umum", start: "13:00", end: "16:00" },
  ],
  "Poli KIA": [
    { name: "dr. Rina Amelia", type: "Dokter", start: "08:00", end: "12:00" },
    { name: "Bidan Dewi Lestari", type: "Bidan", start: "12:00", end: "14:00" },
  ],
  "Poli Gigi": [
    { name: "drg. Fajar Nugraha", type: "Dokter Gigi", start: "08:00", end: "11:00" },
    { name: "drg. Maya Putri", type: "Dokter Gigi", start: "11:00", end: "13:00" },
  ],
  Laboratorium: [
    { name: "Ahmad", type: "Analis Lab", start: "08:00", end: "12:00" },
    { name: "Rina", type: "Analis Lab", start: "12:00", end: "15:00" },
  ],
};

async function main() {
  await prisma.queue.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.service.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  for (const svc of services) {
    const created = await prisma.service.create({ data: svc });
    const staffList = staffByService[svc.name] ?? [];

    for (const person of staffList) {
      const staff = await prisma.staff.create({
        data: {
          name: person.name,
          type: person.type,
          serviceId: created.id,
        },
      });

      for (const day of DAYS) {
        await prisma.schedule.create({
          data: {
            staffId: staff.id,
            serviceId: created.id,
            day,
            startTime: person.start,
            endTime: person.end,
          },
        });
      }
    }
  }

  const users = [
    { name: "Administrator Klinik", username: "admin", password: "admin123", role: "ADMIN" },
    { name: "Petugas Pendaftaran", username: "petugas", password: "petugas123", role: "PETUGAS" },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        name: user.name,
        username: user.username,
        passwordHash: await bcrypt.hash(user.password, 10),
        role: user.role,
      },
    });
  }

  console.log("Seed selesai: layanan, staff, jadwal, dan pengguna berhasil dibuat.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });