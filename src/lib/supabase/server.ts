import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

import { getSupabaseEnv } from "./env";

type CookieOptions = Partial<ResponseCookie>;

type SupabaseCookieOptions = CookieOptions & {
  expires?: CookieOptions["expires"] | string;
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options: SupabaseCookieOptions }>,
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            const { expires, ...rest } = options;
            const normalizedOptions: CookieOptions = {
              ...rest,
              ...(expires
                ? {
                    expires:
                      typeof expires === "string" ? new Date(expires) : expires,
                  }
                : {}),
            };

            cookieStore.set(name, value, normalizedOptions);
          }
        } catch {
          // Server Components can only read cookies, not modify them
          // This is expected behavior for read-only operations
        }
      },
    },
  });
}

export const createClient = createSupabaseServerClient;
