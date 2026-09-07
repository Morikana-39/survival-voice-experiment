export const VERSION = 'survival-voice-v1.2-12items';
export const PERMUTATION_ID = 'rank12-irregular-2026-09-07';
export const SCORING_VERSION = 'footrule-gap-closure-v1';
export const MINIMUM_AGE = 12;
export function isEligibleAge(value: unknown): value is number {
  // Safe-integer validation is a numeric representation check, not a study age ceiling.
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= MINIMUM_AGE
  );
}
export const ITEMS = [
  { id: 'flashlight', label: '手电筒', detail: '使用 4 节电池' },
  { id: 'knife', label: '折叠小刀', detail: '一把' },
  { id: 'map', label: '当地航空地图', detail: '标有区域地形' },
  { id: 'compass', label: '磁性指南针', detail: '一个' },
  { id: 'gauze', label: '急救包', detail: '含纱布和加压敷料' },
  {
    id: 'pistol',
    label: '手枪',
    detail: '口径约 11.4 毫米（.45 英寸），已装弹',
  },
  { id: 'parachute', label: '降落伞', detail: '红白相间' },
  { id: 'water', label: '饮用水', detail: '约 0.95 升（1 美制夸脱）' },
  { id: 'book', label: '《沙漠中的可食用动物》', detail: '一本书' },
  { id: 'sunglasses', label: '太阳镜', detail: '一副' },
  { id: 'coat', label: '厚外套', detail: '一件' },
  { id: 'mirror', label: '化妆镜', detail: '一面' },
] as const;
export const ITEM_IDS: string[] = ITEMS.map((x) => x.id);
// Identical discussion order in both conditions; independent of initial ranks.
export const DISCUSSION_ORDER = [...ITEM_IDS];
export const QUESTIONS = [
  {
    id: 'SP1',
    text: '与这位 AI 语音助手交流时，我感到这是一种有人情味的交流。',
    construct: 'personalness',
  },
  {
    id: 'SP2',
    text: '与这位 AI 语音助手交流时，我感受到人与人接触的感觉。',
    construct: 'human contact',
  },
  {
    id: 'SP3',
    text: '与这位 AI 语音助手交流时，我感觉自己像是在与一个真人交流。',
    construct: 'real person',
  },
  {
    id: 'SP4',
    text: '与这位 AI 语音助手交流时，我感受到社交互动的氛围。',
    construct: 'sociability',
  },
  {
    id: 'SP5',
    text: '与这位 AI 语音助手交流时，我感到它具有人的敏感与体察能力。',
    construct: 'human sensitivity',
  },
] as const;
export const LIKERT_LABELS = [
  '非常不同意',
  '不同意',
  '比较不同意',
  '既不同意也不反对',
  '比较同意',
  '同意',
  '非常同意',
];
export type Phase =
  | 'instructions'
  | 'audio'
  | 'scenario'
  | 'initial'
  | 'discussion'
  | 'revise'
  | 'questionnaire'
  | 'complete'
  | 'withdrawn';
export type Condition = 'fluent' | 'disfluent';
export type Mode = 'preview' | 'study';
export type RankingEvent = {
  item: string;
  from: number;
  to: number;
  atMs: number;
  method: string;
};
export type Exposure = {
  item: string;
  attempts: number;
  interruptions: number;
  durationMs: number;
  listenedMs: number;
  skipped: boolean;
  finishedAt: string;
};
export type State = {
  phase: Phase;
  phaseStartedAt: string;
  initial: string[];
  final: string[];
  reasons: { item: string; text: string; responseMs: number }[];
  exposures: Exposure[];
  audioCount: number;
  audioAttempts: number;
  audioPassed: boolean;
  playbackStartedAt?: string;
  playbackAttempts: number;
  questionnaire: number[];
  questionnaireMs: number;
  rankingEvents: { initial: RankingEvent[]; final: RankingEvent[] };
  timings: Record<string, number>;
  hiddenCount: number;
};
export function freshState(now = new Date().toISOString()): State {
  return {
    phase: 'instructions',
    phaseStartedAt: now,
    initial: [],
    final: [],
    reasons: [],
    exposures: [],
    audioCount: 0,
    audioAttempts: 0,
    audioPassed: false,
    playbackAttempts: 0,
    questionnaire: [],
    questionnaireMs: 0,
    rankingEvents: { initial: [], final: [] },
    timings: {},
    hiddenCount: 0,
  };
}
export function isRanking(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length === ITEM_IDS.length &&
    new Set(value).size === ITEM_IDS.length &&
    value.every((x) => typeof x === 'string' && ITEM_IDS.includes(x))
  );
}
// Index = initial rank minus one; value = one-based AI destination rank.
// Frozen across participants and conditions, not a recovered mapping from Nass.
export const AI_POSITION_BY_INITIAL_RANK = Object.freeze([
  3, 6, 8, 1, 10, 4, 2, 11, 5, 12, 9, 7,
] as const);
export const MAX_RANK_DISTANCE = Math.floor(ITEM_IDS.length ** 2 / 2);
export function aiRanking(initial: string[]): string[] {
  if (!isRanking(initial)) throw new Error('Invalid initial ranking');
  const result = Array<string>(initial.length);
  initial.forEach((item, index) => {
    result[AI_POSITION_BY_INITIAL_RANK[index] - 1] = item;
  });
  return result;
}
export function distance(a: string[], b: string[]): number {
  if (!isRanking(a) || !isRanking(b)) throw new Error('Invalid ranking');
  const positions = new Map(b.map((id, i) => [id, i]));
  return a.reduce((sum, id, i) => sum + Math.abs(i - positions.get(id)!), 0);
}
export function conformity(initial: string[], final: string[]) {
  const ai = aiRanking(initial),
    pre = distance(initial, ai),
    post = distance(final, ai),
    bci = pre === 0 ? null : (pre - post) / pre;
  return {
    ai,
    itemCount: initial.length,
    permutationId: PERMUTATION_ID,
    scoringVersion: SCORING_VERSION,
    maximumDistance: MAX_RANK_DISTANCE,
    initialDistance: pre,
    finalDistance: post,
    bci,
    // Bounded positive gap closure loses information about movement away.
    // Retain the unclipped BCI and raw rankings for the primary analysis decision.
    positiveConformity01: bci === null ? null : Math.max(0, bci),
    alignment01: 1 - post / MAX_RANK_DISTANCE,
    normalizedFinalDistance: post / MAX_RANK_DISTANCE,
    changedItems: final.filter((x, i) => initial[i] !== x).length,
  };
}
export function placeItem(
  slots: (string | null)[],
  item: string,
  target: number,
): (string | null)[] {
  if (!ITEM_IDS.includes(item) || target < 0 || target >= slots.length)
    return slots;
  const next = [...slots],
    from = next.indexOf(item),
    displaced = next[target];
  if (from === target) return slots;
  if (from >= 0 && next.every(Boolean)) {
    next.splice(from, 1);
    next.splice(target, 0, item);
  } else {
    if (from >= 0) next[from] = displaced;
    next[target] = item;
  }
  return next;
}
export type View = {
  id: string;
  mode: Mode;
  protocolMismatch: boolean;
  revision: number;
  phase: Phase;
  initial: string[];
  final: string[];
  ai: string[] | null;
  discussionIndex: number;
  currentItem: string | null;
  reason: string | null;
  audioSrc: string | null;
  audioCheckPassed: boolean;
  questionnaire: number[];
  completionCode: string | null;
};
