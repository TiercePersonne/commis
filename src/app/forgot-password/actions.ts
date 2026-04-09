"use server";

import { headers } from "next/headers";
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
  const headersList = await headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Reset password sends an email. If the user does not exist, Supabase might not return an error depending on security settings.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

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
