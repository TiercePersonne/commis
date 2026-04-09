"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import type { RegisterState } from "./actions";
import { register } from "./actions";

const initialState: RegisterState = { ok: false, message: "" };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  if (state.ok) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 py-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(196,112,75,0.12)] text-[var(--color-accent)]">
          <MailCheck size={32} />
        </div>
        <h3 className="text-xl font-medium text-[var(--color-text-primary)]">
          Consultez vos emails
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Un email de confirmation vous a été envoyé. 
          Veuillez cliquer sur le lien qu&apos;il contient pour finaliser la création de votre compte.
        </p>
      </div>
    );
  }

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
          autoComplete="new-password"
          required
          minLength={6}
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
        S&apos;inscrire
      </button>
    </form>
  );
}
