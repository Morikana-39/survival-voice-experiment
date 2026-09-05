import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const folder = resolve('outputs', `data-test-${crypto.randomUUID()}`);
mkdirSync(folder, { recursive: true });
const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
db.exec(readFileSync('drizzle/0000_aberrant_anita_blake.sql', 'utf8'));
db.prepare('INSERT INTO invitations VALUES (?, ?)').run('token', '2026-09-05');
const insert = db.prepare("INSERT INTO sessions (id,auth_hash,token_hash,mode,condition,version,state,created_at) VALUES (?,?,?,'study','fluent','test','{}','2026-09-05')");
insert.run('one', 'auth-one', 'token');
assert.throws(() => insert.run('two', 'auth-two', 'token'), /UNIQUE/);
db.exec("UPDATE sessions SET status='withdrawn' WHERE id='one'");
assert.throws(() => insert.run('three', 'auth-three', 'token'), /UNIQUE/);
db.close();

const run = (script, ...args) => {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
};
const invitations = join(folder, 'invitations');
run('scripts/create-invitations.mjs', '3', invitations);
const codes = readFileSync(join(invitations, 'invitations.csv'), 'utf8').trim().split('\n').slice(1);
assert.equal(new Set(codes).size, 3);
const sql = readFileSync(join(invitations, 'invitations.sql'), 'utf8');
for (const code of codes) { assert.match(code, /^SV-[A-F0-9]{32}$/); assert.ok(!sql.includes(code)); assert.ok(sql.includes(createHash('sha256').update(code).digest('hex'))); }

const items = ['flashlight','knife','map','raincoat','compass','gauze','pistol','parachute','salt','water','book','sunglasses','vodka','coat','mirror'];
const state = { initial: items, final: items, questionnaire: [4,4,4,4,4], reasons: items.map((item) => ({ item, text: '=1+1', responseMs: 1000 })), exposures: items.map((item) => ({ item, skipped: false, durationMs: 1000, listenedMs: 1000 })) };
const row = { id: 'eligible-test', mode: 'study', status: 'complete', version: 'test', condition: 'fluent', age: 28, gender: 'undisclosed', state, metrics: { eligible: true, ai: items, bci: 0, initialDistance: 72, finalDistance: 72, socialPresence5: 4, socialPresence4: 4 } };
const rows = [row, { ...row, id: 'preview-test', mode: 'preview' }, { ...row, id: 'incomplete-test', status: 'active' }, { ...row, id: 'withdrawn-test', status: 'withdrawn' }, { ...row, id: 'skipped-test', state: { ...state, exposures: state.exposures.map((e) => ({ ...e, skipped: true })) } }];
const source = join(folder, 'source.json'), output = join(folder, 'export');
writeFileSync(source, JSON.stringify([{ results: rows }]), { flag: 'wx' });
run('scripts/export-data.mjs', source, output);
const participants = readFileSync(join(output, 'participants.csv'), 'utf8');
assert.match(participants, /eligible-test/);
assert.doesNotMatch(participants, /preview-test|incomplete-test|withdrawn-test|skipped-test/);
assert.match(readFileSync(join(output, 'discussion.csv'), 'utf8'), /'=1\+1/);
assert.equal(readFileSync(join(output, 'rankings.csv'), 'utf8').split('\r\n').length, 46);
console.log('Data checks passed: unique code constraints including withdrawal, hashed invitation import, complete-only exports, all rankings, CSV formula escaping. All fixtures are synthetic and remain in ignored outputs.');
