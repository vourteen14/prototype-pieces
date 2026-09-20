import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

const COOKIE_NAME = "session";
const SECRET = process.env.SESSION_SECRET ?? "klinik-sahaduta-dev-secret";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

type SessionPayload = {
  userId: number;
  role: string;
  exp: number;
};

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export async function createSession(userId: number, role: string): Promise<void> {
  const payload = base64url(JSON.stringify({ userId, role, exp: Date.now() + SESSION_TTL_MS } satisfies SessionPayload));
  const token = `${payload}.${sign(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", SECRET).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }

  if (Date.now() > parsed.exp) return null;

  return parsed;
}

export async function currentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

export async function guardPetugas() {
  const user = await currentUser();
  if (!user) redirect("/petugas/login");
  if (user.role !== "PETUGAS" && user.role !== "ADMIN") redirect("/");
  return user;
}

export async function guardAdmin() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/petugas");
  return user;
}

// Area pendaftaran pasien: bila staff (petugas/admin) sedang login,
// langkah-langkah pendaftaran diarahkan ke halaman inti masing-masing.
export async function guardPatientArea(): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "PETUGAS") redirect("/petugas");
  redirect("/");
}