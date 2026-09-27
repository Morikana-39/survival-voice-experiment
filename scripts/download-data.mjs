// Authenticated, read-only D1 snapshot. No participant credentials are exported.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const output = process.argv[2];
if (!output || process.argv.length !== 3)
  throw new Error(
    'Usage: node scripts/download-data.mjs private-export/source-query.json',
  );
const destination = resolve(output);
if (existsSync(destination))
  throw new Error('Output exists. Choose a new snapshot filename.');
const root = fileURLToPath(new URL('../', import.meta.url));
const wrangler = resolve(root, 'node_modules/wrangler/bin/wrangler.js');
if (!existsSync(wrangler))
  throw new Error(
    'Install the project dependencies and run npx wrangler login first.',
  );
const sql =
  'SELECT id, mode, status, version, condition, age, gender, state, metrics, created_at, completed_at FROM sessions ORDER BY created_at, id';
const result = spawnSync(
  process.execPath,
  [
    wrangler,
    'd1',
    'execute',
    'DB',
    '--remote',
    '--config',
    'wrangler.local.json',
    '--command',
    sql,
    '--json',
  ],
  {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  },
);
if (result.error || result.status !== 0) {
  throw new Error(
    'D1 query failed. Check Cloudflare login, database permissions, and connectivity. No snapshot was saved.',
  );
}
const parsed = JSON.parse(result.stdout.replace(/^\uFEFF/, ''));
if (
  !Array.isArray(parsed) ||
  parsed.length !== 1 ||
  parsed[0].success === false ||
  !Array.isArray(parsed[0].results)
)
  throw new Error('Unexpected database result. No snapshot was saved.');
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify(parsed, null, 2) + '\n', {
  flag: 'wx',
});
console.log(
  `Saved ${parsed[0].results.length} sessions to ${destination}. Keep this private; no database records were changed.`,
);
