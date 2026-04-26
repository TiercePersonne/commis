import type { NextConfig } from "next";

// C4 — Restreindre remotePatterns aux domaines connus (anti-SSRF)
// Ajouter ici les domaines tiers si nécessaire (ex: CDN d'images de recettes)
const SUPABASE_HOSTNAME = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co';

const nextConfig: NextConfig = {
  output: 'standalone',

  // C3 — Ne pas exposer le header X-Powered-By: Next.js
  poweredByHeader: false,

  images: {
    // C4 — Domaines explicites uniquement, HTTP supprimé
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_HOSTNAME,
        pathname: "/storage/v1/object/public/**",
      },
      // Proxy interne uniquement
      {
        protocol: "https",
        hostname: "localhost",
      },
    ],
  },

  // C3 — Headers de sécurité HTTP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
