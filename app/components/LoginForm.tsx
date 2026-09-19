"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";

export function LoginForm({ next, title }: { next: string; title: string }) {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-bold text-slate-800">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          defaultValue={state.username ?? ""}
          autoComplete="username"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Masukkan username"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-bold text-slate-800">
          Kata Sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="Masukkan kata sandi"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-emerald-700 px-6 py-4 text-lg font-bold text-white hover:bg-emerald-800 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-emerald-300"
      >
        {title}
      </button>
    </form>
  );
}