import { createHmac, timingSafeEqual } from 'crypto';

/** Au-dela, un envoi signe est refuse comme rejeu (tolerance de Svix). */
const SVIX_TOLERANCE_SECONDS = 5 * 60;

/**
 * Signature Svix : Superwall livre ses webhooks par Svix, qui signe
 * `${svix-id}.${svix-timestamp}.${corps brut}` en HMAC-SHA256 avec la partie
 * base64 du secret `whsec_...`. La route attendait un mot de passe dans
 * `Authorization`, que Superwall n'envoie pas : chaque envoi reel recevait 401
 * (constate le 26 septembre, webhook « 0 % success rate » puis desactive).
 */
export function verifySvixSignature(
  rawBody: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > SVIX_TOLERANCE_SECONDS) return false;
  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret, 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest();
  return signature.split(' ').some((part) => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const received = Buffer.from(value, 'base64');
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}
