import { createHash } from 'node:crypto';
import { uploadImage, uploadFromUrl } from './storage';

export type ImageSource = 'stock' | 'nvidia';

export function getImageSource(): ImageSource {
  const src = process.env.IMAGE_SOURCE ?? 'stock';
  return src === 'nvidia' ? 'nvidia' : 'stock';
}

function shouldUploadToStorage(): boolean {
  return process.env.IMAGE_UPLOAD === 'true';
}

/** Resolve a contextual stock photo from AI-provided search keywords. */
export async function resolveStockImage(searchQuery: string): Promise<string> {
  const query = sanitizeQuery(searchQuery);

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const url = await fetchUnsplashPhoto(query, unsplashKey);
      if (url) return url;
    } catch (err) {
      console.warn('Unsplash fetch failed:', err);
    }
  }

  return fetchPicsumImage(query);
}

async function fetchUnsplashPhoto(query: string, accessKey: string): Promise<string | null> {
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
    { headers: { Authorization: `Client-ID ${accessKey}`, 'Accept-Version': 'v1' } },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    urls?: { regular?: string; full?: string; small?: string };
  };

  const remote = data.urls?.regular ?? data.urls?.full ?? data.urls?.small ?? null;
  if (!remote) return null;

  if (!shouldUploadToStorage()) return remote;

  try {
    return await uploadFromUrl(remote);
  } catch {
    return remote;
  }
}

async function fetchPicsumImage(query: string): Promise<string> {
  const seed = createHash('sha256').update(query).digest('hex').slice(0, 12);
  const directUrl = `https://picsum.photos/seed/${seed}/1280/720`;

  if (!shouldUploadToStorage()) return directUrl;

  try {
    const res = await fetch(directUrl, { redirect: 'follow' });
    if (!res.ok) return directUrl;
    const buffer = Buffer.from(await res.arrayBuffer());
    return uploadImage(buffer);
  } catch {
    return directUrl;
  }
}

function sanitizeQuery(raw: string): string {
  const cleaned = raw
    .replace(/[^\w\s,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

  return cleaned || 'professional presentation abstract';
}
