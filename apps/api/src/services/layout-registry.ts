import { existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import type { ValidatedSlide } from '@slideforge/schema';
import { builtinLayouts, builtinLayoutList } from '@slideforge/layouts';

export interface LayoutRegistryEntry {
  id: string;
  name: string;
  author: string;
  category: string;
  version: string;
  thumbnail: string;
  source: string;
  isBuiltin: boolean;
  downloads: number;
}

const repoRoot = resolveRepoRoot();
const communityDir = join(repoRoot, 'community');

let communityLayouts: Record<string, ValidatedSlide> = {};
let registryCache: LayoutRegistryEntry[] | null = null;
const downloadCounts = new Map<string, number>();

function resolveRepoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '../../../../');
}

export async function loadLayoutRegistry(): Promise<void> {
  communityLayouts = {};
  if (!existsSync(communityDir)) {
    registryCache = buildRegistry();
    return;
  }

  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const dirs = readdirSync(communityDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    const configPath = join(communityDir, dir, 'slide.config.ts');
    if (!existsSync(configPath)) continue;
    try {
      const mod = await jiti.import(configPath);
      const def = (mod as { default?: ValidatedSlide }).default ?? mod;
      if (def && typeof def === 'object' && 'id' in def) {
        communityLayouts[(def as ValidatedSlide).id] = def as ValidatedSlide;
      }
    } catch (err) {
      console.warn(`Failed to load community layout ${dir}:`, err);
    }
  }

  registryCache = buildRegistry();
  console.log(`Layout registry: ${builtinLayoutList.length} built-in, ${Object.keys(communityLayouts).length} community`);
}

function buildRegistry(): LayoutRegistryEntry[] {
  const builtin = builtinLayoutList.map((l) => ({
    id: l.id,
    name: l.name,
    author: l.author,
    category: l.category,
    version: l.version,
    thumbnail: l.thumbnail,
    source: `layouts/${l.id}`,
    isBuiltin: true,
    downloads: 0,
  }));

  const community = Object.values(communityLayouts).map((l) => ({
    id: l.id,
    name: l.name,
    author: l.author,
    category: l.category,
    version: l.version,
    thumbnail: l.thumbnail,
    source: `community/${l.id}`,
    isBuiltin: false,
    downloads: downloadCounts.get(l.id) ?? 0,
  }));

  return [...builtin, ...community];
}

export function getRegistry(): LayoutRegistryEntry[] {
  return registryCache ?? buildRegistry();
}

export function getLayout(id: string): ValidatedSlide | undefined {
  return builtinLayouts[id] ?? communityLayouts[id];
}

export function incrementLayoutDownloads(id: string): number {
  const next = (downloadCounts.get(id) ?? 0) + 1;
  downloadCounts.set(id, next);
  registryCache = buildRegistry();
  return next;
}

export function exportRegistryJson(): { version: string; layouts: LayoutRegistryEntry[] } {
  return {
    version: new Date().toISOString().slice(0, 10),
    layouts: getRegistry(),
  };
}

export function writeRegistryToDisk(outPath: string): void {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(exportRegistryJson(), null, 2));
}
