"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ForgotPasswordState =
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export async function forgotPassword(
  _prevState: ForgotPasswordState | undefined,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { type: "error", message: "L'email est requis." };
  }

  const supabase = await createSupabaseServerClient();

  // Reset password sends an email. If the user does not exist, Supabase might not return an error depending on security settings.
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return {
      type: "error",
      message: "Erreur : " + error.message,
    };
  }

  return {
    type: "success",
    message: "Un email de réinitialisation vous a été envoyé.",
  };
}
