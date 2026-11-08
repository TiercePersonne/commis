import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupportedVideoUrl } from '@/lib/utils/url-utils';
import {
  extractFirstUrl,
  verifyInboxToken,
  appendToLocalInbox,
} from '@/lib/utils/inbox-store';

async function enqueueForUser(userId: string, rawInput: string) {
  const cleanUrl = extractFirstUrl(rawInput);
  if (!cleanUrl) {
    return NextResponse.json(
      { ok: false, error: 'Aucune URL valide détectée dans le partage' },
      { status: 400 }
    );
  }

  const sourceType: 'web' | 'reel' = isSupportedVideoUrl(cleanUrl) ? 'reel' : 'web';

  // 1. Si SUPABASE_SERVICE_ROLE_KEY est configuré, insérer directement dans import_jobs
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceKey && supabaseUrl) {
    try {
      const { createClient: createAdminClient } = await import('@supabase/supabase-js');
      const admin = createAdminClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: existing } = await admin
        .from('import_jobs')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'queued')
        .eq('source_url', cleanUrl)
        .maybeSingle();

      if (!existing) {
        const { error } = await admin.from('import_jobs').insert({
          user_id: userId,
          status: 'queued',
          source_url: cleanUrl,
          source_type: sourceType,
        });
        if (!error) {
          return NextResponse.json({
            ok: true,
            message: 'Recette ajoutée à ta liste Commis !',
            url: cleanUrl,
            type: sourceType,
          });
        }
      } else {
        return NextResponse.json({
          ok: true,
          message: 'Déjà présente dans ta liste Commis !',
          url: cleanUrl,
          type: sourceType,
        });
      }
    } catch (err) {
      console.warn('[api/inbox] Admin insert fallback to local buffer:', err);
    }
  }

  // 2. Fallback / stockage tampon sur le serveur (synchronisé dans Supabase à l'ouverture de l'app)
  await appendToLocalInbox(userId, cleanUrl, sourceType);

  return NextResponse.json({
    ok: true,
    message: 'Recette ajoutée à ta liste Commis !',
    url: cleanUrl,
    type: sourceType,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token') ?? '';
  const rawUrl = searchParams.get('url') ?? searchParams.get('text') ?? '';

  let userId = token ? verifyInboxToken(token) : null;

  if (!userId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: 'Jeton invalide ou non authentifié' },
      { status: 401 }
    );
  }

  return enqueueForUser(userId, rawUrl);
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    let token = searchParams.get('token') ?? request.headers.get('x-commis-token') ?? '';
    let rawUrl = searchParams.get('url') ?? '';

    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      token = token || body.token || '';
      rawUrl = rawUrl || body.url || body.text || '';
    } else {
      const textBody = await request.text().catch(() => '');
      rawUrl = rawUrl || textBody;
    }

    let userId = token ? verifyInboxToken(token) : null;
    if (!userId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'Jeton invalide ou non authentifié' },
        { status: 401 }
      );
    }

    return enqueueForUser(userId, rawUrl);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Requête invalide' },
      { status: 400 }
    );
  }
}
