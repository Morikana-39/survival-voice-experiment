import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL ?? 'http://localhost:3000';
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
let cookie = '',
  view;
async function request(
  path,
  body,
  expected = 200,
  origin = base,
  withCookie = true,
) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json', Origin: origin } : {}),
      ...(cookie && withCookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    result = { error: raw.slice(0, 300) };
  }
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(result)}`);
  if (response.headers.get('set-cookie'))
    cookie = response.headers.get('set-cookie').split(';')[0];
  if (result.session) view = result.session;
  return result;
}
async function action(action, fields = {}, expected = 200) {
  return request(
    '/api/action',
    {
      action,
      actionId: crypto.randomUUID(),
      revision: view.revision,
      ...fields,
    },
    expected,
  );
}
const start = { consent: true, age: 12, gender: 'undisclosed', preview: true };
for (const age of [11, 12.5, '12', Number.MAX_SAFE_INTEGER + 1, null])
  await request('/api/session', { ...start, age }, 400);
await request('/api/session', { ...start, consent: false }, 400);
await request('/api/session', start, 403, 'https://unrelated.invalid');
await request('/api/session', { ...start, preview: false }, 403);
await request('/api/session', start, 201);
const firstId = view.id;
await request('/api/session', start);
assert.equal(view.id, firstId, 'duplicate start must restore same session');
assert.equal(view.ai, null);
assert.equal(view.phase, 'instructions');
assert.ok(!('condition' in view));
await action('submit', { answers: [4, 4, 4, 4, 4], responseMs: 2000 }, 400);
await action('instructions');
const toneAction = {
  action: 'tone_start',
  actionId: crypto.randomUUID(),
  revision: view.revision,
};
const tones = await request('/api/action', toneAction);
const version = view.revision;
await request('/api/action', toneAction);
assert.equal(
  view.revision,
  version,
  'idempotent retry cannot advance revision',
);
await new Promise((r) => setTimeout(r, Number(tones.beeps) * 600 + 200));
await action('tone_answer', { count: tones.beeps });
await action('scenario');
await action('initial', { ranking: ids, events: [] });
for (const item of ids) {
  assert.equal(
    view.ai,
    null,
    'AI ranking must remain hidden until every discussion finishes',
  );
  assert.equal(view.currentItem, item);
  await action('reason', {
    item,
    reason: '这件物品的作用值得考虑。',
    responseMs: 1000,
  });
  await request('/api/study');
  assert.ok(view.reason, 'reason must survive a reload');
  assert.equal(view.protocolMismatch, false);
  assert.equal(view.audioSrc, `/audio/fluent/${item}.mp3`);
  const clip = await fetch(base + view.audioSrc, { method: 'HEAD' });
  assert.equal(clip.status, 200);
  assert.match(clip.headers.get('content-type'), /^audio\//);
  await action('exposure', { item, skipped: true, interruptions: 0 });
}
assert.equal(view.phase, 'revise');
assert.equal(view.ai.length, 12);
assert.deepEqual(
  ids.map((item) => view.ai.indexOf(item) + 1),
  [3, 6, 8, 1, 10, 4, 2, 11, 5, 12, 9, 7],
);
await action('final', { ranking: ids, events: [] });
await action('submit', { answers: [4, 4, 4, 0, 4], responseMs: 2000 }, 400);
const finalAction = {
  action: 'submit',
  actionId: crypto.randomUUID(),
  revision: view.revision,
  answers: [4, 4, 4, 4, 4],
  responseMs: 2000,
};
await request('/api/action', finalAction);
const code = view.completionCode;
await request('/api/action', finalAction);
assert.equal(view.completionCode, code);
await action('submit', { answers: [1, 1, 1, 1, 1], responseMs: 2000 }, 409);
await request('/api/study');
assert.equal(view.phase, 'complete');
await request('/api/session', { ...start, restart: true }, 201);
await action('withdraw');
assert.equal(view.phase, 'withdrawn');
await action('instructions', {}, 409);
for (const age of [17, 18, 101]) {
  await request('/api/session', { ...start, age, restart: true }, 201);
  await action('withdraw');
}
console.log(
  'API checks passed: preview flow, consent and age validation, CSRF rejection, closed live collection, resume, fixed discussion order, ranking concealment, idempotent completion, resubmission lock, withdrawal.',
);
