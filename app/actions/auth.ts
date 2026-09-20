"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";

export type LoginState = {
  username?: string;
  error?: string;
};

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const user = await prisma.user.findUnique({ where: { username } });
  const validPassword = user && (await bcrypt.compare(password, user.passwordHash));

  if (!user || !validPassword) {
    return { username, error: "Username atau kata sandi salah." };
  }

  await createSession(user.id, user.role);

  const baseRedirect =
    user.role === "ADMIN"
      ? "/admin/layanan"
      : user.role === "DOKTER"
        ? "/dokter"
        : "/petugas";

  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "";
  redirect(safeNext || baseRedirect);
}

export async function logout() {
  await destroySession();
  redirect("/");
}