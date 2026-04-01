"use client";

import { useActionState } from "react";

import type { LoginState } from "./actions";
import { login } from "./actions";

const initialState: LoginState = { ok: false, message: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[rgba(196,112,75,0.12)]"
        />
      </div>

      {state.ok === false && state.message ? (
        <p className="text-sm text-red-700">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl bg-[var(--color-accent)] px-4 font-medium text-white hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-60"
      >
        Se connecter
      </button>
    </form>
  );
}
