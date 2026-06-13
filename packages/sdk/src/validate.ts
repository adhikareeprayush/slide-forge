import { createJiti } from 'jiti';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateSlide } from '@slideforge/schema';
import type { ValidatedSlide } from '@slideforge/schema';

export function resolveConfigPath(inputPath: string): string {
  const resolved = resolve(process.cwd(), inputPath);
  if (resolved.endsWith('.ts')) return resolved;
  const configPath = resolve(resolved, 'slide.config.ts');
  if (!existsSync(configPath)) {
    throw new Error(`No slide.config.ts found at ${configPath}`);
  }
  return configPath;
}

export async function loadSlideConfig(inputPath: string): Promise<ValidatedSlide> {
  const configPath = resolveConfigPath(inputPath);
  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const mod = await jiti.import(configPath);
  const def = (mod as { default?: unknown }).default ?? mod;
  return validateSlide(def);
}

export async function validateSlideFile(inputPath: string): Promise<ValidatedSlide> {
  return loadSlideConfig(inputPath);
}
