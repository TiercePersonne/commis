"use client";

import { useActionState } from "react";
import type { ForgotPasswordState } from "./actions";
import { forgotPassword } from "./actions";

const initialState: ForgotPasswordState = { type: "error", message: "" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPassword, initialState);

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

      {state.message ? (
        <p className={`text-sm ${state.type === "error" ? "text-red-700" : "text-green-700"}`}>
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl bg-[var(--color-accent)] px-4 font-medium text-white hover:bg-[var(--accent-primary-hover)] transition-colors disabled:opacity-60"
      >
        Réinitialiser le mot de passe
      </button>
    </form>
  );
}
