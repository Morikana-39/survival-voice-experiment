import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const input = process.argv[2],
  directory = resolve(process.argv[3] ?? 'private-export');
if (!input)
  throw new Error(
    'Usage: pnpm export:data <sessions-query.json> [private-output-directory]',
  );
const parsed = JSON.parse(readFileSync(input, 'utf8'));
const rows =
  Array.isArray(parsed) && parsed[0]?.results
    ? parsed[0].results
    : (parsed.results ?? parsed);
if (!Array.isArray(rows))
  throw new Error(
    'Expected query rows, or a Wrangler JSON result containing rows.',
  );
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
  if (
    !m?.eligible ||
    state.questionnaire?.length !== 5 ||
    state.exposures?.length !== 15 ||
    state.exposures.some((e) => e.skipped)
  )
    continue;
  summary.push({
    session_id: row.id,
    version: row.version,
    condition: row.condition,
    age: row.age,
    gender: row.gender,
    started_at: row.created_at,
    completed_at: row.completed_at,
    initial_distance: m.initialDistance,
    final_distance: m.finalDistance,
    bci: m.bci,
    social_presence_5: m.socialPresence5,
    social_presence_4: m.socialPresence4,
    changed_items: m.changedItems,
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
      (/^[=+@\-\t\r]/.test(text) ? "'" : '') +
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
for (const [name, data] of [
  ['participants', summary],
  ['rankings', ranks],
  ['discussion', reasons],
  ['social-presence', survey],
])
  writeFileSync(join(directory, `${String(name)}.csv`), csv(data), {
    flag: 'wx',
  });
console.log(
  `Exported ${summary.length} completed study sessions. Preview, incomplete, withdrawn, and skipped-audio sessions are excluded. Raw source query is unchanged.`,
);
