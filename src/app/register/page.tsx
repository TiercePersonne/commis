import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
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
          Créez votre compte pour gérer vos recettes.
        </p>
        <RegisterForm />

        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-[var(--color-accent)] hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
