import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl glass-panel p-8">
        <div className="mb-3">
          <img
            src="/logo.svg"
            alt="Commis"
            className="h-9 w-auto object-contain brightness-0 invert opacity-95"
          />
        </div>
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          Connectez-vous pour accéder à vos recettes.
        </p>
        <LoginForm />

        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-[var(--color-accent)] hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
