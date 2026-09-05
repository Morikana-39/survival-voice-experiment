import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

// Reuse the locked build dependency already supplied by Drizzle; install nothing.
const require = createRequire(import.meta.url);
const kitRequire = createRequire(require.resolve('drizzle-kit'));
const { build } = kitRequire('esbuild');
await build({
  entryPoints: ['scripts/test-protocol.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'outputs/test-protocol.mjs',
});
const result = spawnSync(
  process.execPath,
  ['--test', 'outputs/test-protocol.mjs'],
  { stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
