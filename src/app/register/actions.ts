"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RegisterState =
  | { ok: true }
  | { ok: false; message: string };

export async function register(
  _prevState: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Email et mot de passe requis." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return {
      ok: false,
      message: "Erreur lors de l'inscription : " + error.message,
    };
  }

  redirect("/");
}
