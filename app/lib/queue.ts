import "server-only";

import { prisma } from "./prisma";
import {
  endOfToday,
  generateQueueNumber,
  nowTime,
  startOfToday,
  todayDayName,
} from "./time";

export async function getOnDutyStaff(serviceId: number) {
  const day = todayDayName();
  const time = nowTime();

  const working = await prisma.schedule.findMany({
    where: {
      serviceId,
      day,
      startTime: { lte: time },
      endTime: { gte: time },
    },
    include: { staff: true },
    orderBy: { startTime: "asc" },
  });

  return working[0]?.staff ?? null;
}

export async function getNextSchedule(serviceId: number) {
  const day = todayDayName();
  const time = nowTime();

  const next = await prisma.schedule.findMany({
    where: {
      serviceId,
      day,
      startTime: { gt: time },
    },
    include: { staff: true },
    orderBy: { startTime: "asc" },
  });

  return next[0] ?? null;
}

export async function getWaitingCount(
  serviceId: number,
  excludeQueueId?: number,
) {
  return prisma.queue.count({
    where: {
      serviceId,
      queueDate: { gte: startOfToday(), lte: endOfToday() },
      status: "MENUNGGU",
      ...(excludeQueueId ? { id: { not: excludeQueueId } } : {}),
    },
  });
}

export function estimateWaitMinutes(waitingCount: number): number {
  return waitingCount * 10;
}

export async function createQueueNumber(serviceId: number) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new Error("Layanan tidak ditemukan");

  const todayCount = await prisma.queue.count({
    where: {
      serviceId,
      queueDate: { gte: startOfToday(), lte: endOfToday() },
      status: { not: "BATAL" },
    },
  });

  return generateQueueNumber(service.code, todayCount + 1);
}