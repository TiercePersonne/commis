import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-light)] shadow-[0_8px_24px_rgba(44,24,16,0.10)] p-8">
        <h1 className="text-2xl font-serif font-bold text-[var(--color-accent)] mb-1">
          Commis
        </h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Connecte-toi pour accéder à tes recettes.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
