export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

export type GenerationEvent =
  | {
      type: 'outline_ready';
      slides: {
        layoutId: string;
        brief: string;
        title?: string;
        layout: import('@slideforge/schema').ValidatedSlide | null;
      }[];
    }
  | { type: 'slide_content_ready'; slideIndex: number; slideId: string; slots: Record<string, string | string[]> }
  | { type: 'image_ready'; slideIndex: number; slideId: string; slotId: string; url: string }
  | { type: 'generation_complete'; deckId: string }
  | { type: 'error'; message: string };

export interface GenerateResponse {
  deckId: string;
  jobId: string;
  wsUrl: string;
}

export async function startGeneration(body: {
  topic: string;
  slideCount?: number;
  tone?: 'professional' | 'casual' | 'bold';
  theme?: string;
}): Promise<GenerateResponse> {
  const res = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Generation failed (${res.status})`);
  }
  return res.json() as Promise<GenerateResponse>;
}

export function connectGenerationSocket(
  jobId: string,
  onEvent: (event: GenerationEvent) => void,
  onError?: (err: Event) => void,
): WebSocket {
  const ws = new WebSocket(`${WS_URL}/ws/generate/${jobId}`);
  ws.onmessage = (msg) => {
    try {
      onEvent(JSON.parse(msg.data as string) as GenerationEvent);
    } catch {
      // ignore malformed
    }
  };
  ws.onerror = (e) => onError?.(e);
  return ws;
}
