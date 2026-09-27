import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const source = 'dist/client';
const destination = 'vercel-gateway';
const assets = [
  '_next',
  'audio',
  'experiment-frame.png',
  'favicon.svg',
  'vinext-client-entry-manifest.json',
];

if (!existsSync(source))
  throw new Error('Build output is missing. Run npm run build first.');

for (const asset of assets)
  cpSync(join(source, asset), join(destination, asset), {
    recursive: true,
    force: true,
  });

console.log(
  'Copied current frontend assets into the Vercel gateway. Existing hashed assets were retained for open or cached pages.',
);
