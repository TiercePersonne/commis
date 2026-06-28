import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)] shadow-[0_8px_24px_rgba(44,24,16,0.10)] p-8">
        <div className="mb-2">
          <img 
            src="/logo.svg" 
            alt="Commis" 
            className="h-9 w-auto object-contain"
          />
        </div>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Connecte-toi pour accéder à tes recettes.
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
