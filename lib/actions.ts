import {
  DISCUSSION_ORDER,
  isRanking,
  freshState,
  WARMUP_DURATION_MS,
  type State,
  type Mode,
  type RankingEvent,
  type Phase,
} from './protocol';

export class ActionError extends Error {}
function requireThat(
  test: unknown,
  message = '请按顺序完成当前步骤。',
): asserts test {
  if (!test) throw new ActionError(message);
}
function numberIn(value: unknown, low: number, high: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= low &&
    value <= high
  );
}
function events(value: unknown): RankingEvent[] {
  requireThat(
    Array.isArray(value) && value.length <= 500,
    '排序操作记录格式错误。',
  );
  for (const e of value)
    requireThat(
      e &&
        DISCUSSION_ORDER.includes(e.item) &&
        Number.isInteger(e.from) &&
        e.from >= -1 &&
        e.from < DISCUSSION_ORDER.length &&
        Number.isInteger(e.to) &&
        e.to >= -1 &&
        e.to < DISCUSSION_ORDER.length &&
        numberIn(e.atMs, 0, 86400000) &&
        ['drag', 'tap', 'up', 'down', 'remove', 'reset'].includes(e.method),
      '排序操作记录格式错误。',
    );
  return value as RankingEvent[];
}
export function applyAction(
  current: State,
  _mode: Mode,
  b: Record<string, unknown>,
  now: number,
  randomCount = 3,
): State {
  const s: State = structuredClone(current);
  const phase = (expected: Phase) => requireThat(s.phase === expected);
  const advance = (next: Phase) => {
    s.timings[s.phase] =
      (s.timings[s.phase] ?? 0) +
      Math.max(0, now - Date.parse(s.phaseStartedAt));
    s.phase = next;
    s.phaseStartedAt = new Date(now).toISOString();
  };
  requireThat(
    !['complete', 'withdrawn'].includes(s.phase),
    '本次实验已结束，无法再次提交。',
  );
  switch (b.action) {
    case 'withdraw': {
      const empty = freshState(new Date(now).toISOString());
      empty.phase = 'withdrawn';
      return empty;
    }
    case 'instructions':
      phase('instructions');
      advance('audio');
      break;
    case 'tone_start':
      phase('audio');
      s.audioCount = randomCount;
      s.audioAttempts += 1;
      s.timings.toneStarted = now;
      break;
    case 'tone_answer':
      phase('audio');
      requireThat(
        s.audioCount > 0 && now - s.timings.toneStarted >= s.audioCount * 600,
      );
      requireThat(
        b.count === s.audioCount,
        '数量不正确，请确认声音开启后重新播放。',
      );
      s.audioPassed = true;
      advance('scenario');
      break;
    case 'scenario':
      phase('scenario');
      requireThat(s.audioPassed);
      advance('initial');
      break;
    case 'initial':
      phase('initial');
      requireThat(
        isRanking(b.ranking),
        '请将所有物品放入排名框，每项只能出现一次。',
      );
      s.initial = [...b.ranking];
      s.rankingEvents.initial = events(b.events);
      advance('discussion');
      break;
    case 'reason': {
      phase('discussion');
      requireThat(s.warmup, '请先完整收听交流前的语音。');
      const i = s.exposures.length;
      requireThat(
        i < DISCUSSION_ORDER.length &&
          b.item === DISCUSSION_ORDER[i] &&
          s.reasons.length === i,
      );
      requireThat(
        Array.isArray(b.reasonOptions) &&
          b.reasonOptions.length >= 1 &&
          b.reasonOptions.length <= 5,
        '请至少选择一项、最多选择五项理由。',
      );
      requireThat(
        b.reasonOptions.every(
          (x: unknown) => typeof x === 'string' && x.length <= 120,
        ),
      );
      requireThat(
        !b.reasonOptions.includes('其他原因') ||
          (typeof b.otherReason === 'string' &&
            b.otherReason.trim().length > 0),
        '请选择或填写其他原因。',
      );
      requireThat(
        typeof b.otherReason === 'string'
          ? b.otherReason.trim().length <= 500
          : b.otherReason === undefined,
        '其他原因不能超过500字。',
      );
      requireThat(numberIn(b.responseMs, 0, 86400000));
      s.reasons.push({
        item: DISCUSSION_ORDER[i],
        text:
          typeof b.reason === 'string' && b.reason.trim()
            ? b.reason.trim()
            : [
                ...(b.reasonOptions as string[]),
                ...(typeof b.otherReason === 'string' && b.otherReason.trim()
                  ? [`其他：${b.otherReason.trim()}`]
                  : []),
              ].join('；'),
        responseMs: b.responseMs,
      });
      s.playbackAttempts = 0;
      delete s.playbackStartedAt;
      break;
    }
    case 'play_start':
      phase('discussion');
      requireThat(s.warmup);
      requireThat(s.reasons.length === s.exposures.length + 1);
      s.playbackStartedAt = new Date(now).toISOString();
      s.playbackAttempts += 1;
      break;
    case 'warmup_start':
      phase('discussion');
      requireThat(
        !s.warmup && s.exposures.length === 0 && s.reasons.length === 0,
      );
      s.playbackStartedAt = new Date(now).toISOString();
      s.playbackAttempts += 1;
      break;
    case 'warmup_complete': {
      phase('discussion');
      requireThat(
        !s.warmup && s.exposures.length === 0 && s.reasons.length === 0,
      );
      const skipped = b.skipped === true;
      requireThat(!skipped, '请完整收听语音后继续。');
      requireThat(
        s.playbackStartedAt &&
          numberIn(
            b.durationMs,
            WARMUP_DURATION_MS - 150,
            WARMUP_DURATION_MS + 150,
          ) &&
          numberIn(b.listenedMs, WARMUP_DURATION_MS - 100, 600000) &&
          now - Date.parse(s.playbackStartedAt!) >= WARMUP_DURATION_MS - 100,
        '请完整收听语音后继续。',
      );
      requireThat(
        Number.isInteger(b.interruptions) && numberIn(b.interruptions, 0, 1000),
      );
      s.warmup = {
        item: 'warmup',
        skipped,
        attempts: s.playbackAttempts,
        interruptions: Number(b.interruptions),
        durationMs: skipped ? 0 : Number(b.durationMs),
        listenedMs: skipped ? 0 : Number(b.listenedMs),
        finishedAt: new Date(now).toISOString(),
      };
      delete s.playbackStartedAt;
      s.playbackAttempts = 0;
      break;
    }
    case 'exposure': {
      phase('discussion');
      requireThat(s.warmup);
      const i = s.exposures.length;
      requireThat(b.item === DISCUSSION_ORDER[i] && s.reasons.length === i + 1);
      const skipped = b.skipped === true;
      requireThat(!skipped, '必须完整播放语音。');
      requireThat(
        s.playbackStartedAt &&
          numberIn(b.durationMs, 200, 600000) &&
          numberIn(b.listenedMs, 200, 600000),
      );
      requireThat(
        b.listenedMs >= b.durationMs - 100 &&
          now - Date.parse(s.playbackStartedAt!) >= b.durationMs - 100,
        '请完整听完语音后继续。',
      );
      requireThat(
        Number.isInteger(b.interruptions) && numberIn(b.interruptions, 0, 1000),
      );
      s.exposures.push({
        item: DISCUSSION_ORDER[i],
        attempts: s.playbackAttempts,
        interruptions: Number(b.interruptions),
        durationMs: skipped ? 0 : Number(b.durationMs),
        listenedMs: skipped ? 0 : Number(b.listenedMs),
        skipped,
        finishedAt: new Date(now).toISOString(),
      });
      delete s.playbackStartedAt;
      s.playbackAttempts = 0;
      if (s.exposures.length === DISCUSSION_ORDER.length) advance('revise');
      break;
    }
    case 'final':
      phase('revise');
      requireThat(isRanking(b.ranking), '请完成最终排序。');
      requireThat(s.exposures.length === DISCUSSION_ORDER.length);
      s.final = [...b.ranking];
      s.rankingEvents.final = events(b.events);
      advance('questionnaire');
      break;
    case 'submit':
      phase('questionnaire');
      requireThat(
        isRanking(s.initial) &&
          isRanking(s.final) &&
          s.audioPassed &&
          s.warmup &&
          !s.warmup.skipped &&
          s.exposures.length === DISCUSSION_ORDER.length,
      );
      requireThat(
        s.exposures.every(
          (e) => !e.skipped && e.listenedMs >= e.durationMs - 100,
        ),
      );
      requireThat(
        Array.isArray(b.answers) &&
          b.answers.length === 5 &&
          b.answers.every((n) => Number.isInteger(n) && numberIn(n, 1, 7)),
        '请回答全部 5 道题。',
      );
      requireThat(numberIn(b.responseMs, 0, 86400000));
      s.questionnaire = b.answers as number[];
      s.questionnaireMs = b.responseMs;
      if (numberIn(b.hiddenCount, 0, 10000)) s.hiddenCount = b.hiddenCount;
      advance('complete');
      break;
    default:
      throw new ActionError('未知操作。');
  }
  return s;
}
