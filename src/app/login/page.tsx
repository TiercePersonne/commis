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

      <a 
        href="https://paypal.me/GJCommis" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-bg-card)]/90 backdrop-blur-md border border-[var(--color-border-light)] text-xs text-[var(--color-text-secondary)] shadow-[0_8px_20px_-6px_rgba(44,24,16,0.15)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:shadow-[0_8px_20px_-6px_rgba(196,112,75,0.25)] hover:scale-105 transition-all duration-200"
      >
        <span>🚗</span>
        <span className="font-medium whitespace-nowrap">Buy me a <span className="line-through opacity-60">coffe</span> Lambo.</span>
      </a>
    </div>
  );
}
