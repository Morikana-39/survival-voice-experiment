import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEM_IDS,
  DISCUSSION_ORDER,
  isRanking,
  aiRanking,
  distance,
  conformity,
  placeItem,
  freshState,
} from '../lib/protocol';
import { applyAction } from '../lib/actions';

await test('fixed permutation preserves every item and equal disagreement across initial rankings', () => {
  for (let shift = 0; shift < ITEM_IDS.length; shift++) {
    const p = [...ITEM_IDS.slice(shift), ...ITEM_IDS.slice(0, shift)];
    const ai = aiRanking(p);
    assert.ok(isRanking(ai));
    assert.equal(ai.indexOf(p[1]), 4);
    assert.equal(distance(p, ai), 72);
    assert.equal(conformity(p, p).bci, 0);
    assert.equal(conformity(p, ai).bci, 1);
  }
});
await test('ranking placement never duplicates items; replacing an occupied slot returns displaced item to tray', () => {
  let a = Array(15).fill(null);
  a = placeItem(a, ITEM_IDS[0], 0);
  a = placeItem(a, ITEM_IDS[1], 0);
  assert.equal(a[0], ITEM_IDS[1]);
  assert.equal(a.includes(ITEM_IDS[0]), false);
  const full = placeItem(ITEM_IDS, ITEM_IDS[0], 14);
  assert.ok(isRanking(full));
  assert.equal(full[14], ITEM_IDS[0]);
  assert.equal(placeItem(a, 'unknown', 4), a);
  assert.equal(isRanking(Array(15).fill('water')), false);
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
