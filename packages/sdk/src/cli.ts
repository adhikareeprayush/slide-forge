#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { validateSlideFile } from './validate';
import { scaffoldLayout } from './scaffold';
import { previewSlide } from './preview';

const program = new Command();

program
  .name('slideforge')
  .description('SlideForge developer CLI')
  .version('0.0.1');

program
  .command('validate <path>')
  .description('Validate a slide.config.ts file or layout directory')
  .action(async (path: string) => {
    try {
      const slide = await validateSlideFile(path);
      console.log(pc.green('✓ Valid slide definition'));
      console.log(`  id:       ${slide.id}`);
      console.log(`  name:     ${slide.name}`);
      console.log(`  version:  ${slide.version}`);
      console.log(`  category: ${slide.category}`);
      console.log(`  slots:    ${slide.slots.length}`);
    } catch (err) {
      console.error(pc.red('✗ Validation failed'));
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('new <name>')
  .description('Scaffold a new slide layout directory')
  .option('-o, --output <dir>', 'Output directory (default: ./<name>)')
  .action(async (name: string, opts: { output?: string }) => {
    try {
      const dir = await scaffoldLayout(
        opts.output ? { name, outputDir: opts.output } : { name },
      );
      console.log(pc.green('✓ Layout scaffolded'));
      console.log(`  ${dir}/`);
      console.log(`    slide.config.ts`);
      console.log(`    Slide.tsx`);
      console.log(`    thumbnail.svg`);
      console.log(`    README.md`);
      console.log(pc.dim('\nNext: slideforge validate . && slideforge preview .'));
    } catch (err) {
      console.error(pc.red('✗ Scaffold failed'));
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('preview <path>')
  .description('Preview a layout in the browser (localhost:4000)')
  .option('-p, --port <port>', 'Port number', '4000')
  .action(async (path: string, opts: { port: string }) => {
    try {
      await previewSlide({ path, port: Number(opts.port) });
    } catch (err) {
      console.error(pc.red('✗ Preview failed'));
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program
  .command('publish <path>')
  .description('Validate and prepare a community layout for submission')
  .option('--repo <repo>', 'Target GitHub repo (owner/name)')
  .action(async (path: string, opts: { repo?: string }) => {
    try {
      const { publishLayout } = await import('./publish');
    await publishLayout({ path, ...(opts.repo !== undefined && { repo: opts.repo }) });
      console.log(pc.green('✓ Ready for community submission'));
    } catch (err) {
      console.error(pc.red('✗ Publish failed'));
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse();
