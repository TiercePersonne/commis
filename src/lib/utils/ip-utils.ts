import { promises as dns } from 'dns';

/**
 * Vérifie si une adresse IP appartient à une plage privée, loopback ou link-local.
 * Utilisé pour prévenir les attaques SSRF (Server-Side Request Forgery).
 */
export function isPrivateIpAddress(ip: string): boolean {
  // IPv6 loopback
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true;

  // Extraire les parties IPv4
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    // Pourrait être une adresse IPv6 non loopback — bloquer par précaution
    return ip.startsWith('::') || ip.toLowerCase().startsWith('fe80') || ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd');
  }

  const [a, b] = parts;

  // Loopback : 127.0.0.0/8
  if (a === 127) return true;
  // RFC 1918 — 10.0.0.0/8
  if (a === 10) return true;
  // RFC 1918 — 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // RFC 1918 — 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // Link-local — 169.254.0.0/16 (APIPA / AWS metadata)
  if (a === 169 && b === 254) return true;
  // Multicast — 224.0.0.0/4
  if (a >= 224 && a <= 239) return true;

  return false;
}

/**
 * Résout le DNS d'un hostname et vérifie que toutes ses adresses IP sont publiques.
 * Retourne true si l'une des IPs est privée (SSRF potentiel).
 */
export async function hostnameResolvesToPrivateIp(hostname: string): Promise<boolean> {
  try {
    const addresses = await dns.resolve(hostname);
    return addresses.some(isPrivateIpAddress);
  } catch {
    // En cas d'échec de résolution DNS, bloquer par défaut
    return true;
  }
}
