import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, readFile, rm, writeFile, access, readdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ExtractedRecipe } from '@/lib/schemas/import-job';
import { ImportError, IMPORT_ERROR_MESSAGES } from './import-web';
import { isSupportedVideoUrl } from './url-utils';

export { isSupportedVideoUrl };

const execFileAsync = promisify(execFile);

async function downloadReelAudio(
  reelUrl: string,
  cookiesContent?: string | null
): Promise<{ audioPath: string; description: string; thumbnail: string | null; tmpDir: string }> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'commis-reel-'));
  const outputTemplate = join(tmpDir, 'audio.%(ext)s');

  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const ytDlpBin = isProduction ? '/usr/local/bin/yt-dlp' : 'python';
    const isInstagram = reelUrl.includes('instagram.com');

    // --- APIFY PATH FOR INSTAGRAM ---
    if (isInstagram && process.env.APIFY_API_TOKEN) {
      console.log('[import-reel] Using Apify for Instagram extraction');
      const { ApifyClient } = await import('apify-client');
      const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
      
      // apify/instagram-scraper is the standard actor for this
      const run = await client.actor("apify/instagram-scraper").call({
        directUrls: [reelUrl],
        resultsType: "details",
      });
      
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      const item = items[0] as any;
      
      if (!item || !item.videoUrl) {
         console.error('[import-reel] Apify returned no videoUrl:', item);
         throw new ImportError(IMPORT_ERROR_MESSAGES.SITE_UNREACHABLE, 'SITE_UNREACHABLE');
      }

      const directVideoUrl = item.videoUrl;
      const description = item.caption || '';
      const thumbnail = item.displayUrl || null;

      // Use yt-dlp purely to download and extract audio from the direct MP4 url
      const dlArgs = [
        '--no-playlist', '--no-warnings',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '5',
        '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        '--add-header', 'Referer:https://www.instagram.com/',
        '-o', outputTemplate,
        directVideoUrl,
      ];
      
      const dlArgsWithModule = isProduction ? dlArgs : ['-m', 'yt_dlp', ...dlArgs];

      const { stderr: dlStderr } = await execFileAsync(ytDlpBin, dlArgsWithModule, {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });

      let apifySuccess = false;
      if (dlStderr?.includes('ERROR:')) {
        console.warn('[import-reel] Apify direct mp4 download failed (likely 403). Falling back to local yt-dlp...', dlStderr.slice(0, 300));
      } else {
        const files = await readdir(tmpDir);
        const audioFile = files.find((f) => /\.(mp3|m4a|aac|ogg|opus|webm|wav)$/i.test(f));
        if (audioFile) {
          apifySuccess = true;
          return { audioPath: join(tmpDir, audioFile), description, thumbnail, tmpDir };
        } else {
          console.warn('[import-reel] Apify download succeeded but no audio file found. Falling back...');
        }
      }

      if (!apifySuccess) {
        console.log('[import-reel] Proceeding to fallback yt-dlp method...');
      }
    }

    // --- STANDARD YT-DLP PATH (TikTok, YouTube, or fallback) ---
    const localCookiesPath = join(process.cwd(), 'instagram-cookies.txt');
    let cookiesPath: string | null = null;
    
    if (isInstagram) {
      const effectiveCookies = cookiesContent || process.env.INSTAGRAM_SHARED_COOKIES || null;
      try {
        await access(localCookiesPath);
        cookiesPath = localCookiesPath;
      } catch {
        if (effectiveCookies) {
          const tmpCookiesPath = join(tmpDir, 'cookies.txt');
          await writeFile(tmpCookiesPath, effectiveCookies, 'utf8');
          cookiesPath = tmpCookiesPath;
        }
      }
    }

    const commonArgs = ['--no-playlist', '--no-warnings'];
    if (cookiesPath) commonArgs.push('--cookies', cookiesPath);

    const descArgs = [
      ...commonArgs,
      '--print', 'description',
      '--print', 'thumbnail',
      '--skip-download',
      reelUrl,
    ];

    const descArgsWithModule = isProduction ? descArgs : ['-m', 'yt_dlp', ...descArgs];
    console.log('[import-reel] using binary:', ytDlpBin);

    const { stdout: descStdout, stderr: descStderr } = await execFileAsync(ytDlpBin, descArgsWithModule, {
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024,
    }).catch(() => ({ stdout: '', stderr: '' }));

    if (descStderr?.includes('ERROR:')) {
      console.error('[import-reel] description fetch error:', descStderr.slice(0, 300));
      throw new ImportError(IMPORT_ERROR_MESSAGES.SITE_UNREACHABLE, 'SITE_UNREACHABLE');
    }

    const lines = (descStdout ?? '').replace(/\r\n/g, '\n').split('\n');
    const lastLine = lines.at(-1)?.trim() ?? '';
    const secondLastLine = lines.at(-2)?.trim() ?? '';
    const thumbnail = lastLine.startsWith('http') ? lastLine
      : secondLastLine.startsWith('http') ? secondLastLine
      : null;
    const cutAt = thumbnail === lastLine ? -1 : thumbnail === secondLastLine ? -2 : undefined;
    const description = lines.slice(0, cutAt).join('\n').trim();

    const dlArgs = [
      ...commonArgs,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '5',
      '-o', outputTemplate,
      reelUrl,
    ];

    const dlArgsWithModule = isProduction ? dlArgs : ['-m', 'yt_dlp', ...dlArgs];

    const { stderr: dlStderr } = await execFileAsync(ytDlpBin, dlArgsWithModule, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    }).catch(async (err) => {
      // yt-dlp returns an error if extraction fails (e.g. no audio codec)
      return { stderr: String(err) };
    });

    if (dlStderr?.includes('ERROR:') && !dlStderr?.includes('audio codec')) {
      console.error('[import-reel] download error:', dlStderr.slice(0, 300));
      // Don't throw immediately, we might still have a description!
    }

    const files = await readdir(tmpDir);

    const audioFile = files.find((f) => /\.(mp3|m4a|aac|ogg|opus|webm|wav)$/i.test(f));
    if (!audioFile && !description) {
      console.error('[import-reel] No audio file and no description found. tmpDir files:', files);
      throw new ImportError(IMPORT_ERROR_MESSAGES.EXTRACTION_FAILED, 'EXTRACTION_FAILED');
    }
    const audioPath = audioFile ? join(tmpDir, audioFile) : null;

    return { audioPath, description, thumbnail, tmpDir };
  } catch (err) {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    if (err instanceof ImportError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[import-reel] yt-dlp/apify failed:', msg.slice(0, 500));
    throw new ImportError(IMPORT_ERROR_MESSAGES.SITE_UNREACHABLE, 'SITE_UNREACHABLE');
  }
}

async function extractRecipeFromAudio(
  audioPath: string | null,
  description: string,
  reelUrl: string,
  thumbnail: string | null
): Promise<Omit<ExtractedRecipe, 'confidence'>> {
  if (!process.env.GEMINI_API_KEY) {
    throw new ImportError(IMPORT_ERROR_MESSAGES.LLM_UNAVAILABLE, 'LLM_UNAVAILABLE');
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const contentParts: any[] = [];

  if (audioPath) {
    const audioBuffer = await readFile(audioPath);
    const MAX_BYTES = 19 * 1024 * 1024;
    if (audioBuffer.byteLength > MAX_BYTES) {
      throw new ImportError(
        "La vidéo est trop longue pour être traitée (limite : ~19 Mo d'audio).",
        'EXTRACTION_FAILED'
      );
    }
    const audioBase64 = audioBuffer.toString('base64');

    const ext = audioPath.split('.').pop()?.toLowerCase() ?? 'mp3';
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mp3', m4a: 'audio/mp4', aac: 'audio/aac',
      ogg: 'audio/ogg', opus: 'audio/ogg', webm: 'audio/webm', wav: 'audio/wav',
    };
    const mimeType = mimeMap[ext] ?? 'audio/mp4';
    
    contentParts.push({ inlineData: { mimeType, data: audioBase64 } });
  }

  const descriptionSection = description
    ? `\n\nDescription/légende du post :\n${description}`
    : '';

  const prompt = `Tu es un extracteur de recettes de cuisine. TOUTES TES RÉPONSES DOIVENT ÊTRE EN FRANÇAIS, quelle que soit la langue d'origine.

Analyse ce contenu (audio si disponible, et description) issu d'un post (par ex. Instagram, TikTok ou YouTube) et extrait la recette présentée.${descriptionSection}

Retourne UNIQUEMENT un objet JSON valide avec ces champs (TOUT en français) :
{
  "title": "titre de la recette EN FRANÇAIS",
  "ingredients": ["ingrédient complet avec quantité EN FRANÇAIS", ...],
  "steps": ["étape complète de préparation EN FRANÇAIS", ...],
  "suggested_tags": ["catégorie ou type de plat EN FRANÇAIS", ...]
}

Règles OBLIGATOIRES :
- TOUT doit être écrit en français : titre, ingrédients, étapes, tags
- Si l'audio est en anglais, traduis intégralement en français
- Transcris tous les ingrédients avec leurs quantités
- Transcris toutes les étapes dans l'ordre
- Utilise aussi la description si elle contient des informations utiles
- Réponds UNIQUEMENT avec le JSON, sans backticks ni texte autour
- URL source : ${reelUrl}`;

  contentParts.unshift({ text: prompt });

  const result = await model.generateContent(contentParts);

  const content = result.response.text().trim();
  if (!content) {
    throw new ImportError(IMPORT_ERROR_MESSAGES.EXTRACTION_FAILED, 'EXTRACTION_FAILED');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[import-reel] No JSON in Gemini response:', content.slice(0, 200));
    throw new ImportError(IMPORT_ERROR_MESSAGES.EXTRACTION_FAILED, 'EXTRACTION_FAILED');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const title: string = parsed.title || '';
  if (!title) {
    throw new ImportError(IMPORT_ERROR_MESSAGES.EXTRACTION_FAILED, 'EXTRACTION_FAILED');
  }

  const ingredients = (parsed.ingredients || []).map((t: string, order: number) => ({ text: t, order }));
  const steps = (parsed.steps || []).map((t: string, order: number) => ({ text: t, order }));
  const suggested_tags: string[] = (parsed.suggested_tags || []).slice(0, 8);

  return { title, ingredients, steps, image_url: thumbnail, suggested_tags, source_url: reelUrl };
}

export async function extractRecipeFromReel(
  reelUrl: string,
  onStatusUpdate: (status: string) => Promise<void>,
  cookiesContent?: string | null
): Promise<ExtractedRecipe> {
  if (!isSupportedVideoUrl(reelUrl)) {
    throw new ImportError(IMPORT_ERROR_MESSAGES.INVALID_URL, 'INVALID_URL');
  }

  await onStatusUpdate('downloading');
  const { audioPath, description, thumbnail, tmpDir } = await downloadReelAudio(reelUrl, cookiesContent);

  try {
    await onStatusUpdate('structuring');
    const extracted = await extractRecipeFromAudio(audioPath, description, reelUrl, thumbnail);

    const confidence: 'complete' | 'partial' =
      extracted.ingredients.length > 0 && extracted.steps.length > 0 ? 'complete' : 'partial';

    return { ...extracted, confidence };
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
