import { readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { encrypt, decrypt } from './crypto';

const INBOX_FILE_PATH = join(tmpdir(), 'commis-inbox-queue.json');

export interface BufferedInboxItem {
  id: string;
  user_id: string;
  source_url: string;
  source_type: 'web' | 'reel';
  created_at: string;
}

/**
 * Extrait la première URL http(s) valide d'un texte partagé
 * (ex: "Regarde cette recette https://www.instagram.com/reel/XYZ/?igsh=...")
 */
export function extractFirstUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const match = input.match(/https?:\/\/[^\s"'<>]+/i);
  if (!match) return null;
  // Nettoyer la ponctuation finale éventuelle
  const raw = match[0].replace(/[.,;!?)]+$/, '');
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Génère un jeton personnel chiffré à partir du userId.
 */
export function createInboxToken(userId: string): string {
  return Buffer.from(encrypt(`inbox:${userId}`), 'utf8').toString('base64url');
}

/**
 * Vérifie et déchiffre un jeton personnel pour récupérer le userId.
 */
export function verifyInboxToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const decrypted = decrypt(raw);
    if (!decrypted.startsWith('inbox:')) return null;
    const userId = decrypted.slice('inbox:'.length).trim();
    return userId.length > 10 ? userId : null;
  } catch {
    return null;
  }
}

async function readBufferFile(): Promise<BufferedInboxItem[]> {
  try {
    const content = await readFile(INBOX_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBufferFile(items: BufferedInboxItem[]): Promise<void> {
  try {
    await writeFile(INBOX_FILE_PATH, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.error('[inbox-store] Failed to write buffer file:', err);
  }
}

export async function appendToLocalInbox(
  userId: string,
  sourceUrl: string,
  sourceType: 'web' | 'reel'
): Promise<BufferedInboxItem> {
  const items = await readBufferFile();
  const existing = items.find(
    (item) => item.user_id === userId && item.source_url === sourceUrl
  );
  if (existing) return existing;

  const newItem: BufferedInboxItem = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    source_url: sourceUrl,
    source_type: sourceType,
    created_at: new Date().toISOString(),
  };

  items.push(newItem);
  await writeBufferFile(items);
  return newItem;
}

export async function consumeLocalInboxForUser(
  userId: string
): Promise<BufferedInboxItem[]> {
  const items = await readBufferFile();
  const userItems = items.filter((i) => i.user_id === userId);
  if (userItems.length === 0) return [];

  const remaining = items.filter((i) => i.user_id !== userId);
  await writeBufferFile(remaining);
  return userItems;
}
