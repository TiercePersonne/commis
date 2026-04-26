import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hostnameResolvesToPrivateIp } from '@/lib/utils/ip-utils';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
  'sec-fetch-dest': 'image',
  'sec-fetch-mode': 'no-cors',
  'sec-fetch-site': 'cross-site',
};

async function tryFetch(url: string, withReferer: boolean): Promise<Response | null> {
  try {
    const headers: Record<string, string> = { ...BROWSER_HEADERS };
    if (withReferer) {
      const parsed = new URL(url);
      headers['Referer'] = `${parsed.protocol}//${parsed.host}/`;
    }
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (res.ok) return res;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // A1 — Exiger l'authentification
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const rawUrl = request.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 });
  }

  // A1 — Bloquer les IP privées (SSRF)
  const isPrivate = await hostnameResolvesToPrivateIp(parsed.hostname);
  if (isPrivate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = parsed.toString();

  try {
    // Tentative 1 : avec Referer (même domaine)
    let response = await tryFetch(url, true);

    // Tentative 2 : sans Referer (contourne certaines protections anti-hotlink)
    if (!response) {
      response = await tryFetch(url, false);
    }

    if (!response) {
      console.error(`[image-proxy] 403/failed for: ${url}`);
      return NextResponse.json({ error: 'Image fetch failed' }, { status: 502 });
    }

    // A1 — Valider que le Content-Type est bien une image
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 422 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        // A1 — Headers de sécurité
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Image proxy error' }, { status: 502 });
  }
}
