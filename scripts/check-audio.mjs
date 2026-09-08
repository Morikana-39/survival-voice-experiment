import { existsSync, statSync } from 'node:fs';
const ids = [
  'flashlight',
  'knife',
  'map',
  'compass',
  'gauze',
  'pistol',
  'parachute',
  'water',
  'book',
  'sunglasses',
  'coat',
  'mirror',
];
const missing = [
  'public/audio/warmup.mp3',
  ...['fluent', 'disfluent'].flatMap((group) =>
    ids.map((id) => `public/audio/${group}/${id}.mp3`),
  ),
].filter((path) => !existsSync(path) || statSync(path).size < 1000);
if (missing.length) {
  console.error(
    `Live collection is not audio-ready: ${missing.length} recordings missing or empty. Preview remains available.\n${missing.join('\n')}`,
  );
  process.exitCode = 1;
} else
  console.log(
    'All 24 condition recordings and the common warmup exist. Listen to every clip and verify the matched manipulation before approving stimuli.',
  );
