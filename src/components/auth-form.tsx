"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/actions/auth";

type Props = {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  title: string;
  submitLabel: string;
  altHref: string;
  altLabel: string;
};

export function AuthForm({
  action,
  title,
  submitLabel,
  altHref,
  altLabel,
}: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    null,
  );

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="font-display text-center text-3xl font-semibold">{title}</h1>

      <form action={formAction} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium">
            Имя пользователя
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="bg-card w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="bg-card w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        {state?.error && (
          <p className="text-destructive text-sm">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground w-full rounded-xl px-4 py-2.5 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Подождите…" : submitLabel}
        </button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        <Link href={altHref} className="underline underline-offset-4">
          {altLabel}
        </Link>
      </p>
    </main>
  );
}
