import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { describeGroups } from './lib/describe-groups.mjs';

const usage =
  'Usage: node scripts/export-data.mjs <sessions-query.json> [output-directory] [--exclude exclusions.json]';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}
let exclusionsPath;
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--exclude') {
    if (exclusionsPath || !args[i + 1] || args[i + 1].startsWith('--'))
      throw new Error(usage);
    exclusionsPath = args[++i];
  } else if (args[i].startsWith('--')) throw new Error(usage);
  else positional.push(args[i]);
}
if (positional.length > 2) throw new Error(usage);
const input = positional[0],
  directory = resolve(positional[1] ?? 'private-export');
if (!input) throw new Error(usage);
const sourceBytes = readFileSync(input);
const parsed = JSON.parse(sourceBytes.toString('utf8').replace(/^\uFEFF/, ''));
const rows =
  Array.isArray(parsed) && parsed[0]?.results
    ? parsed[0].results
    : (parsed.results ?? parsed);
if (!Array.isArray(rows))
  throw new Error(
    'Expected query rows, or a Wrangler JSON result containing rows.',
  );
const ids = new Set();
for (const row of rows) {
  if (!row || typeof row.id !== 'string' || !row.id.trim() || ids.has(row.id))
    throw new Error(
      'Every source row must have a unique, nonempty session id.',
    );
  ids.add(row.id);
}
const exclusions = new Map();
let exclusionBytes;
if (exclusionsPath) {
  exclusionBytes = readFileSync(exclusionsPath);
  const entries = JSON.parse(
    exclusionBytes.toString('utf8').replace(/^\uFEFF/, ''),
  );
  if (!Array.isArray(entries))
    throw new Error('Exclusions must be an array of {session_id, reason}.');
  for (const entry of entries) {
    if (
      !entry ||
      typeof entry.session_id !== 'string' ||
      typeof entry.reason !== 'string' ||
      !entry.reason.trim()
    )
      throw new Error(
        'Each exclusion needs a session_id and a nonempty reason.',
      );
    if (!ids.has(entry.session_id))
      throw new Error(`Unknown exclusion session_id: ${entry.session_id}`);
    if (exclusions.has(entry.session_id))
      throw new Error(`Duplicate exclusion: ${entry.session_id}`);
    exclusions.set(entry.session_id, entry.reason.trim());
  }
}
const audit = rows
  .filter((row) => row.mode !== 'study' || row.status !== 'complete')
  .map((row) => ({
    session_id: row.id,
    included: false,
    reason: row.mode !== 'study' ? 'not-study-mode' : `status-${row.status}`,
    manual_reason: exclusions.get(row.id) ?? null,
  }));
const usable = rows.filter(
  (row) => row.mode === 'study' && row.status === 'complete',
);
const summary = [],
  ranks = [],
  reasons = [],
  survey = [];
for (const row of usable) {
  const state =
      typeof row.state === 'string' ? JSON.parse(row.state) : row.state,
    m = typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics;
  // Use each record's own item set and stored metrics. Never apply the new
  // 12-item permutation/denominator retrospectively to a 15-item record.
  const count = state?.initial?.length;
  const sameItems = (ranking) =>
    Array.isArray(ranking) &&
    ranking.length === count &&
    new Set(ranking).size === count &&
    ranking.every((id) => state.initial.includes(id));
  if (
    !m?.eligible ||
    (row.version === 'survival-voice-v1.3-warmup' &&
      (!state.warmup || state.warmup.skipped)) ||
    ![12, 15].includes(count) ||
    !sameItems(state.initial) ||
    !sameItems(state.final) ||
    !sameItems(m.ai) ||
    state.questionnaire?.length !== 5 ||
    !state.questionnaire.every(
      (n) => Number.isInteger(n) && n >= 1 && n <= 7,
    ) ||
    state.exposures?.length !== count ||
    state.reasons?.length !== count ||
    !sameItems(state.exposures.map((e) => e.item)) ||
    state.reasons.some((r, i) => r.item !== state.exposures[i].item) ||
    state.exposures.some((e) => e.skipped)
  ) {
    audit.push({
      session_id: row.id,
      included: false,
      reason: 'failed-existing-eligibility-checks',
      manual_reason: exclusions.get(row.id) ?? null,
    });
    continue;
  }
  if (exclusions.has(row.id)) {
    audit.push({
      session_id: row.id,
      included: false,
      reason: 'manual-exclusion',
      manual_reason: exclusions.get(row.id),
    });
    continue;
  }
  audit.push({
    session_id: row.id,
    included: true,
    reason: 'eligible',
    manual_reason: null,
  });
  summary.push({
    session_id: row.id,
    version: row.version,
    item_count: count,
    permutation_id:
      m.permutationId ??
      ([
        'survival-voice-v1',
        'survival-voice-v1.0',
        'survival-voice-v1.1',
      ].includes(row.version)
        ? 'legacy-cyclic-shift-3'
        : 'unrecorded'),
    scoring_version: m.scoringVersion ?? 'legacy-bci',
    condition: row.condition,
    age: row.age,
    gender: row.gender,
    started_at: row.created_at,
    completed_at: row.completed_at,
    initial_distance: m.initialDistance,
    final_distance: m.finalDistance,
    bci: m.bci,
    positive_conformity_01: m.positiveConformity01 ?? null,
    alignment_01: m.alignment01 ?? null,
    maximum_distance: m.maximumDistance ?? Math.floor(count ** 2 / 2),
    social_presence_5: m.socialPresence5,
    social_presence_4: m.socialPresence4,
    changed_items: m.changedItems,
    warmup_duration_ms: state.warmup?.durationMs ?? null,
    warmup_listened_ms: state.warmup?.listenedMs ?? null,
    warmup_attempts: state.warmup?.attempts ?? null,
    warmup_interruptions: state.warmup?.interruptions ?? null,
  });
  for (const [phase, order] of [
    ['initial', state.initial],
    ['ai', m.ai],
    ['final', state.final],
  ])
    order.forEach((item, index) =>
      ranks.push({ session_id: row.id, phase, item, rank: index + 1 }),
    );
  state.reasons.forEach((r, index) =>
    reasons.push({
      session_id: row.id,
      discussion_order: index + 1,
      item: r.item,
      reason: r.text,
      response_ms: r.responseMs,
      ...state.exposures[index],
    }),
  );
  state.questionnaire.forEach((response, index) =>
    survey.push({ session_id: row.id, item: `SP${index + 1}`, response }),
  );
}
mkdirSync(directory, { recursive: true });
const csv = (records) => {
  if (!records.length) return '';
  const keys = Object.keys(records[0]);
  const cell = (v) => {
    const text = String(v ?? '');
    return (
      '"' +
      (typeof v === 'string' && /^[=+@\-\t\r]/.test(text) ? "'" : '') +
      text.replaceAll('"', '""') +
      '"'
    );
  };
  return (
    '\uFEFF' +
    [
      keys.map(cell).join(','),
      ...records.map((r) => keys.map((k) => cell(r[k])).join(',')),
    ].join('\r\n')
  );
};
const files = [
  ['participants', summary],
  ['rankings', ranks],
  ['discussion', reasons],
  ['social-presence', survey],
  ['analysis-summary', describeGroups(summary)],
];
for (const name of [
  ...files.map(([name]) => `${String(name)}.csv`),
  'export-audit.json',
])
  if (existsSync(join(directory, name)))
    throw new Error(
      `Output already exists: ${name}. Choose a new output directory.`,
    );
for (const [name, data] of files)
  writeFileSync(join(directory, `${String(name)}.csv`), csv(data), {
    flag: 'wx',
  });
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
writeFileSync(
  join(directory, 'export-audit.json'),
  JSON.stringify(
    {
      exporter_version: '2-exclusions-descriptive-summary',
      exported_at: new Date().toISOString(),
      source_sha256: sha256(sourceBytes),
      exporter_sha256: sha256(readFileSync(new URL(import.meta.url))),
      summary_script_sha256: sha256(
        readFileSync(new URL('./lib/describe-groups.mjs', import.meta.url)),
      ),
      exclusions_sha256: exclusionBytes ? sha256(exclusionBytes) : null,
      source_sessions: rows.length,
      included_sessions: summary.length,
      automatically_excluded_sessions: audit.filter(
        (r) => !r.included && r.reason !== 'manual-exclusion',
      ).length,
      manually_excluded_eligible_sessions: audit.filter(
        (r) => r.reason === 'manual-exclusion',
      ).length,
      decisions: audit,
    },
    null,
    2,
  ) + '\n',
  { flag: 'wx' },
);
console.log(
  `Exported ${summary.length} completed study sessions. Preview, incomplete, withdrawn, and skipped-audio sessions are excluded. Keep protocol versions/item counts separate; stored legacy outcomes are not recomputed. Raw source query is unchanged.`,
);
console.log(
  `Manual exclusions of otherwise eligible sessions: ${audit.filter((r) => r.reason === 'manual-exclusion').length}. Descriptive results: analysis-summary.csv. Decisions and source fingerprints: export-audit.json.`,
);
