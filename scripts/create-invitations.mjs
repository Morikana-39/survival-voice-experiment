import { randomBytes, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const count = Number(process.argv[2] ?? 100),
  directory = resolve(process.argv[3] ?? 'private-invitations');
if (!Number.isInteger(count) || count < 1 || count > 500)
  throw new Error('Choose 1–500 one-time invitations.');
if (existsSync(join(directory, 'invitations.csv')))
  throw new Error(
    'Refusing to overwrite existing invitations. Use a new directory.',
  );
mkdirSync(directory, { recursive: true });
const codes = Array.from(
    { length: count },
    () => `SV-${randomBytes(16).toString('hex').toUpperCase()}`,
  ),
  created = new Date().toISOString();
writeFileSync(
  join(directory, 'invitations.csv'),
  'invitation_code\n' + codes.join('\n') + '\n',
  { flag: 'wx' },
);
writeFileSync(
  join(directory, 'invitations.sql'),
  codes
    .map(
      (code) =>
        `INSERT INTO invitations (token_hash, created_at) VALUES ('${createHash('sha256').update(code).digest('hex')}', '${created}');`,
    )
    .join('\n'),
  { flag: 'wx' },
);
console.log(
  `Created ${count} unique invitations in the selected private directory. Distribute one per eligible person; do not publish the code list.`,
);
