import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
config({ path: resolve(root, '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only UI + schema on the client — never bundle SDK/layouts (pulls esbuild/vite).
  transpilePackages: ['@slideforge/ui', '@slideforge/schema'],
};

export default nextConfig;
