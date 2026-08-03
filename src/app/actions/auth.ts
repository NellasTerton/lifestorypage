"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { users } from "@/db/schema";
import {
  checkPassword,
  createSession,
  destroySession,
  hashPassword,
} from "@/lib/auth";
import { getDb } from "@/lib/db";

export type AuthState = { error: string } | null;

function readCredentials(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { username, password };
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { username, password } = readCredentials(formData);

  if (username.length < 3) {
    return { error: "Имя пользователя — минимум 3 символа." };
  }
  if (password.length < 6) {
    return { error: "Пароль — минимум 6 символов." };
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing) {
    return { error: "Это имя уже занято." };
  }

  const [user] = await db
    .insert(users)
    .values({ username, passwordHash: await hashPassword(password) })
    .returning({ id: users.id });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { username, password } = readCredentials(formData);

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  // Same message for unknown user and wrong password — telling them apart
  // would let anyone enumerate which usernames exist.
  const ok = user && (await checkPassword(password, user.passwordHash));
  if (!ok) {
    return { error: "Неверное имя пользователя или пароль." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
