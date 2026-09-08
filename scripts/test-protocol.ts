import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEM_IDS,
  MINIMUM_AGE,
  MAXIMUM_AGE,
  WARMUP_DURATION_MS,
  isEligibleAge,
  DISCUSSION_ORDER,
  isRanking,
  aiRanking,
  distance,
  conformity,
  placeItem,
  freshState,
  VERSION,
  AI_POSITION_BY_INITIAL_RANK,
  MAX_RANK_DISTANCE,
} from '../lib/protocol';
import { reviewPages } from '../lib/navigation';
import { applyAction } from '../lib/actions';
import { STUDY, collectionReady } from '../lib/study-config';
import { view } from '../lib/session-view';
import type { SessionRow } from '../lib/server-study';
import { REQUIRED_AUDIO } from '../lib/audio-manifest';
import { readdirSync, statSync } from 'node:fs';

await test('age eligibility is inclusive 12–65', () => {
  assert.equal(MINIMUM_AGE, 12);
  assert.equal(MAXIMUM_AGE, 65);
  for (const age of [12, 13, 17, 18, 64, 65])
    assert.equal(isEligibleAge(age), true);
  for (const age of [
    11,
    66,
    100,
    65.1,
    12.5,
    '12',
    null,
    undefined,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.equal(isEligibleAge(age), false);
});
await test('collection stays closed until the minor-participation readiness gate is met', () => {
  const otherwiseReady = {
    ...STUDY,
    open: true,
    consentApproved: true,
    stimuliApproved: true,
    researcher: 'Test researcher',
    contact: 'Test contact',
    retentionDescription: 'Test policy',
  };
  assert.equal(collectionReady(STUDY), false);
  assert.equal(collectionReady(otherwiseReady), false);
  assert.equal(
    collectionReady({ ...otherwiseReady, minorParticipationReady: true }),
    true,
  );
});

await test('fixed permutation preserves every item and equal disagreement across initial rankings', () => {
  assert.equal(ITEM_IDS.length, 12);
  assert.deepEqual(ITEM_IDS, [
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
  ]);
  assert.deepEqual(
    AI_POSITION_BY_INITIAL_RANK,
    [3, 6, 8, 1, 10, 4, 2, 11, 5, 12, 9, 7],
  );
  assert.deepEqual(
    [...AI_POSITION_BY_INITIAL_RANK].sort((a, b) => a - b),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  AI_POSITION_BY_INITIAL_RANK.forEach((target, i) => {
    assert.ok(Math.abs(target - i - 1) >= 2 && Math.abs(target - i - 1) <= 5);
  });
  assert.equal(MAX_RANK_DISTANCE, 72);
  for (let shift = 0; shift < ITEM_IDS.length; shift++) {
    const p = [...ITEM_IDS.slice(shift), ...ITEM_IDS.slice(0, shift)];
    const ai = aiRanking(p);
    assert.ok(isRanking(ai));
    p.forEach((id, i) =>
      assert.equal(ai.indexOf(id) + 1, AI_POSITION_BY_INITIAL_RANK[i]),
    );
    assert.equal(distance(p, ai), 42);
    assert.equal(conformity(p, p).bci, 0);
    assert.equal(conformity(p, ai).bci, 1);
  }
});
await test('conformity distinguishes bounded positive movement, raw movement and final alignment', () => {
  const initial = ITEM_IDS,
    ai = aiRanking(initial);
  const unchanged = conformity(initial, initial),
    full = conformity(initial, ai);
  assert.equal(unchanged.positiveConformity01, 0);
  assert.equal(unchanged.alignment01, 1 - 42 / 72);
  assert.equal(full.positiveConformity01, 1);
  assert.equal(full.alignment01, 1);
  const away = conformity(initial, [...ai].reverse());
  assert.equal(away.finalDistance, 72);
  assert.equal(away.bci, -30 / 42);
  assert.equal(away.positiveConformity01, 0);
  assert.equal(away.alignment01, 0);
  // Exhaust all possible positions of six selected items, plus reversed variants.
  function check(prefix: string[], rest: string[]) {
    if (rest.length) {
      rest.forEach((id, i) =>
        check(
          [...prefix, id],
          rest.filter((_, j) => i !== j),
        ),
      );
      return;
    }
    for (const final of [
      [...prefix, ...ITEM_IDS.slice(6)],
      [...prefix, ...ITEM_IDS.slice(6)].reverse(),
    ]) {
      const m = conformity(initial, final);
      assert.ok(m.positiveConformity01! >= 0 && m.positiveConformity01! <= 1);
      assert.ok(m.alignment01 >= 0 && m.alignment01 <= 1);
      assert.equal(m.initialDistance, 42);
      assert.equal(m.finalDistance % 2, 0);
    }
  }
  check([], ITEM_IDS.slice(0, 6));
});
await test('only the selected twelve fluent audio assets are installed', () => {
  assert.equal(REQUIRED_AUDIO.length, 24);
  assert.deepEqual(
    readdirSync('public/audio/fluent')
      .filter((x) => x.endsWith('.mp3'))
      .sort(),
    ITEM_IDS.map((id) => id + '.mp3').sort(),
  );
  for (const id of ITEM_IDS)
    assert.ok(statSync(`public/audio/fluent/${id}.mp3`).size > 1000);
});
await test('view reveals ranks only after discussion, uses assigned study audio and isolates old records', () => {
  const state = freshState();
  state.phase = 'discussion';
  state.initial = ITEM_IDS;
  state.warmup = {
    item: 'warmup',
    skipped: false,
    attempts: 1,
    interruptions: 0,
    durationMs: 13632,
    listenedMs: 13632,
    finishedAt: new Date().toISOString(),
  };
  state.reasons = [{ item: ITEM_IDS[0], text: '理由', responseMs: 1000 }];
  const row = {
    id: 'test',
    mode: 'study',
    condition: 'disfluent',
    version: VERSION,
    revision: 0,
    state: JSON.stringify(state),
    completion_code: null,
  } as SessionRow;
  assert.equal(view(row).ai, null);
  assert.equal(view(row).audioSrc, '/audio/disfluent/flashlight.mp3');
  assert.equal(
    view({ ...row, mode: 'preview' }).audioSrc,
    '/audio/fluent/flashlight.mp3',
  );
  state.phase = 'revise';
  assert.deepEqual(
    view({ ...row, state: JSON.stringify(state) }).ai,
    aiRanking(ITEM_IDS),
  );
  const legacyState = {
    ...state,
    initial: [...ITEM_IDS, 'raincoat', 'salt', 'vodka'],
  };
  const legacy = {
    ...row,
    version: 'survival-voice-v1',
    state: JSON.stringify(legacyState),
  };
  const before = JSON.stringify(legacy);
  const output = view(legacy);
  assert.equal(output.protocolMismatch, true);
  assert.deepEqual(output.initial, []);
  assert.equal(output.ai, null);
  assert.equal(output.audioSrc, null);
  assert.equal(JSON.stringify(legacy), before, 'old records remain untouched');
});
await test('ranking placement never duplicates items; replacing an occupied slot returns displaced item to tray', () => {
  let a = Array(ITEM_IDS.length).fill(null);
  a = placeItem(a, ITEM_IDS[0], 0);
  a = placeItem(a, ITEM_IDS[1], 0);
  assert.equal(a[0], ITEM_IDS[1]);
  assert.equal(a.includes(ITEM_IDS[0]), false);
  const full = placeItem(ITEM_IDS, ITEM_IDS[0], ITEM_IDS.length - 1);
  assert.ok(isRanking(full));
  assert.equal(full[ITEM_IDS.length - 1], ITEM_IDS[0]);
  assert.equal(placeItem(a, 'unknown', 4), a);
  assert.equal(isRanking(Array(ITEM_IDS.length).fill('water')), false);
});
await test('full preview flow has fixed discussion order, complete questionnaire, and terminal submission', () => {
  let now = Date.now(),
    s = freshState(new Date(now).toISOString());
  const step = (b: Record<string, unknown>) => {
    now += 5000;
    s = applyAction(s, 'preview', b, now, 3);
  };
  assert.throws(() =>
    applyAction(
      s,
      'preview',
      { action: 'submit', answers: [4, 4, 4, 4, 4] },
      now,
    ),
  );
  step({ action: 'instructions' });
  step({ action: 'tone_start' });
  assert.throws(() =>
    applyAction(s, 'preview', { action: 'tone_answer', count: 2 }, now + 5000),
  );
  step({ action: 'tone_answer', count: 3 });
  step({ action: 'scenario' });
  assert.throws(() =>
    applyAction(
      s,
      'preview',
      { action: 'initial', ranking: ITEM_IDS.slice(1), events: [] },
      now,
    ),
  );
  step({ action: 'initial', ranking: ITEM_IDS, events: [] });
  step({ action: 'warmup_complete', skipped: true, interruptions: 0 });
  for (const item of DISCUSSION_ORDER) {
    assert.throws(() =>
      applyAction(
        s,
        'preview',
        { action: 'exposure', item, skipped: true, interruptions: 0 },
        now,
      ),
    );
    step({
      action: 'reason',
      item,
      reason: '这件物品可能有助于生存。',
      responseMs: 5000,
    });
    assert.throws(() =>
      applyAction(
        s,
        'study',
        { action: 'exposure', item, skipped: true, interruptions: 0 },
        now,
      ),
    );
    step({ action: 'exposure', item, skipped: true, interruptions: 0 });
  }
  assert.equal(s.phase, 'revise');
  step({ action: 'final', ranking: aiRanking(ITEM_IDS), events: [] });
  assert.throws(() =>
    applyAction(
      s,
      'preview',
      { action: 'submit', answers: [4, 4, 4, 0, 4], responseMs: 3000 },
      now,
    ),
  );
  step({ action: 'submit', answers: [4, 4, 4, 4, 4], responseMs: 5000 });
  assert.equal(s.phase, 'complete');
  assert.throws(() =>
    applyAction(
      s,
      'preview',
      { action: 'submit', answers: [1, 1, 1, 1, 1], responseMs: 3000 },
      now,
    ),
  );
});
await test('real audio cannot finish before start or before enough elapsed listening time', () => {
  const now = Date.now();
  const s = freshState();
  s.phase = 'discussion';
  s.initial = ITEM_IDS;
  s.warmup = {
    item: 'warmup',
    skipped: false,
    attempts: 1,
    interruptions: 0,
    durationMs: 13632,
    listenedMs: 13632,
    finishedAt: new Date().toISOString(),
  };
  s.reasons = [{ item: ITEM_IDS[0], text: '理由', responseMs: 2000 }];
  const e = {
    action: 'exposure',
    item: ITEM_IDS[0],
    durationMs: 5000,
    listenedMs: 5000,
    interruptions: 0,
  };
  assert.throws(() => applyAction(s, 'study', e, now));
  const started = applyAction(s, 'study', { action: 'play_start' }, now);
  assert.throws(() => applyAction(started, 'study', e, now + 100));
  assert.throws(() =>
    applyAction(started, 'study', { ...e, listenedMs: 50 }, now + 6000),
  );
  assert.equal(
    applyAction(started, 'study', e, now + 6000).exposures.length,
    1,
  );
});
await test('withdrawal clears answers and prevents re-entry into the same state', () => {
  const s = freshState();
  s.initial = ITEM_IDS;
  const w = applyAction(s, 'study', { action: 'withdraw' }, Date.now());
  assert.deepEqual(w.initial, []);
  assert.equal(w.phase, 'withdrawn');
  assert.throws(() =>
    applyAction(w, 'study', { action: 'instructions' }, Date.now()),
  );
});
await test('tap swaps two items without shifting intervening items', () => {
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 12; j++) {
      const swapped = placeItem(ITEM_IDS, ITEM_IDS[i], j, true);
      assert.equal(swapped[j], ITEM_IDS[i]);
      assert.equal(swapped[i], ITEM_IDS[j]);
      ITEM_IDS.forEach((id, k) => {
        if (k !== i && k !== j) assert.equal(swapped[k], id);
      });
      assert.ok(isRanking(swapped));
    }
});
await test('informational returns cannot reopen tasks or leave discussion', () => {
  for (const phase of ['consent', 'discussion', 'complete', 'withdrawn'])
    assert.deepEqual(reviewPages(phase), []);
  for (const phase of [
    'instructions',
    'audio',
    'scenario',
    'initial',
    'revise',
    'questionnaire',
  ]) {
    assert.ok(reviewPages(phase).length);
    assert.ok(
      reviewPages(phase).every((p) =>
        ['consent', 'instructions', 'scenario'].includes(p),
      ),
    );
  }
});
await test('warmup must finish once before reasons and survives reload without revealing condition', () => {
  const now = Date.now(),
    s = freshState();
  s.phase = 'discussion';
  s.initial = ITEM_IDS;
  const reason = {
    action: 'reason',
    item: ITEM_IDS[0],
    reason: '理由',
    responseMs: 1000,
  };
  assert.throws(() => applyAction(s, 'study', reason, now));
  assert.throws(() =>
    applyAction(
      s,
      'study',
      { action: 'warmup_complete', skipped: true, interruptions: 0 },
      now,
    ),
  );
  const start = applyAction(s, 'study', { action: 'warmup_start' }, now);
  const finish = {
    action: 'warmup_complete',
    skipped: false,
    durationMs: WARMUP_DURATION_MS,
    listenedMs: WARMUP_DURATION_MS,
    interruptions: 0,
  };
  assert.throws(() => applyAction(start, 'study', finish, now + 100));
  assert.throws(() =>
    applyAction(
      start,
      'study',
      { ...finish, durationMs: 200, listenedMs: 200 },
      now + 20000,
    ),
  );
  const ready = applyAction(start, 'study', finish, now + 14000);
  assert.equal(ready.warmup?.attempts, 1);
  assert.equal(ready.exposures.length, 0);
  assert.throws(() =>
    applyAction(ready, 'study', { action: 'warmup_start' }, now + 15000),
  );
  assert.equal(
    applyAction(ready, 'study', reason, now + 15000).reasons.length,
    1,
  );
  const row = {
    id: 'test',
    mode: 'study',
    condition: 'disfluent',
    version: VERSION,
    revision: 0,
    state: JSON.stringify(s),
    completion_code: null,
  } as SessionRow;
  assert.equal(view(row).warmupPending, true);
  assert.equal(view(row).audioSrc, '/audio/warmup.mp3');
  assert.equal(view(row).condition, null);
  assert.equal(
    view({ ...row, state: JSON.stringify(ready) }).warmupPending,
    false,
  );
  const complete = { ...ready, phase: 'complete', final: ITEM_IDS };
  assert.equal(
    view({ ...row, state: JSON.stringify(complete) }).condition,
    'disfluent',
  );
  assert.equal(
    applyAction(ready, 'study', { action: 'withdraw' }, now).warmup,
    null,
  );
});
