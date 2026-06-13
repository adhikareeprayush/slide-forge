import { API_URL } from './api-client';
import type { LayoutMeta } from './editor-api';

export type ExportFormat = 'pptx' | 'pdf' | 'html';

export interface ExportJob {
  id: string;
  deckId: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}

export async function startExport(deckId: string, format: ExportFormat): Promise<{ exportJobId: string }> {
  const res = await fetch(`${API_URL}/api/decks/${deckId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Export failed (${res.status})`);
  }
  return res.json() as Promise<{ exportJobId: string }>;
}

export async function pollExport(exportJobId: string): Promise<ExportJob> {
  const res = await fetch(`${API_URL}/api/export/${exportJobId}`);
  if (!res.ok) throw new Error('Export job not found');
  return res.json() as Promise<ExportJob>;
}

export async function waitForExport(exportJobId: string, maxMs = 120_000): Promise<ExportJob> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const job = await pollExport(exportJobId);
    if (job.status === 'completed' || job.status === 'failed') return job;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Export timed out');
}

export async function fetchLayoutsFiltered(opts?: {
  category?: string;
  sort?: 'name' | 'popular';
}): Promise<LayoutMeta[]> {
  const params = new URLSearchParams();
  if (opts?.category) params.set('category', opts.category);
  if (opts?.sort === 'popular') params.set('sort', 'popular');
  const qs = params.toString();
  const res = await fetch(`${API_URL}/api/layouts${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to load layouts');
  const data = (await res.json()) as { layouts: LayoutMeta[] };
  return data.layouts;
}

export async function fetchLayoutDetail(id: string) {
  const res = await fetch(`${API_URL}/api/layouts/${id}`);
  if (!res.ok) throw new Error('Layout not found');
  return res.json();
}

export async function useLayout(id: string): Promise<void> {
  await fetch(`${API_URL}/api/layouts/${id}/use`, { method: 'POST' });
}
