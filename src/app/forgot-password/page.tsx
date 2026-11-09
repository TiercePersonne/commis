import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl glass-panel p-8">
        <h1 className="text-2xl font-serif font-medium text-[var(--color-text-primary)] mb-1">
          Mot de passe oublié
        </h1>
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          Saisissez votre adresse email pour recevoir un lien de réinitialisation.
        </p>

        <ForgotPasswordForm />

        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
