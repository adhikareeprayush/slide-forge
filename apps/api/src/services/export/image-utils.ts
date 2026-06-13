const imageCache = new Map<string, string>();

export async function fetchImageAsDataUri(url: string): Promise<string | null> {
  if (!url || url.startsWith('data:')) return url || null;
  if (imageCache.has(url)) return imageCache.get(url)!;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;
    imageCache.set(url, dataUri);
    return dataUri;
  } catch {
    return null;
  }
}

export function pctToInches(pct: string, total: number): number {
  const n = parseFloat(pct.replace('%', ''));
  return (n / 100) * total;
}

export const SLIDE_W_IN = 10;
export const SLIDE_H_IN = 5.625;
export const SLIDE_W_PT = 720;
export const SLIDE_H_PT = 405;
