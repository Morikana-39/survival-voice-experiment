export const VERSION = 'survival-voice-v1.0';
export const ITEMS = [
  { id: 'flashlight', label: '手电筒', detail: '使用 4 节电池' },
  { id: 'knife', label: '折叠小刀', detail: '一把' },
  { id: 'map', label: '当地航空地图', detail: '标有区域地形' },
  { id: 'raincoat', label: '塑料雨衣', detail: '大号' },
  { id: 'compass', label: '磁性指南针', detail: '一个' },
  { id: 'gauze', label: '急救包', detail: '含纱布和加压敷料' },
  {
    id: 'pistol',
    label: '手枪',
    detail: '口径约 11.4 毫米（.45 英寸），已装弹',
  },
  { id: 'parachute', label: '降落伞', detail: '红白相间' },
  { id: 'salt', label: '盐片', detail: '一瓶，1,000 片' },
  { id: 'water', label: '饮用水', detail: '约 0.95 升（1 美制夸脱）' },
  { id: 'book', label: '《沙漠中的可食用动物》', detail: '一本书' },
  { id: 'sunglasses', label: '太阳镜', detail: '一副' },
  {
    id: 'vodka',
    label: '伏特加',
    detail: '约 1.9 升，酒精度 90%（180 proof）',
  },
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
// An item initially at rank r receives AI rank ((r - 1 + 3) mod n) + 1.
// Same disagreement for every participant; a pilot choice, not a reported full mapping from Nass.
export function aiRanking(initial: string[]): string[] {
  if (!isRanking(initial)) throw new Error('Invalid initial ranking');
  const n = initial.length;
  return initial.map((_, index) => initial[(index - 3 + n) % n]);
}
export function distance(a: string[], b: string[]): number {
  if (!isRanking(a) || !isRanking(b)) throw new Error('Invalid ranking');
  const positions = new Map(b.map((id, i) => [id, i]));
  return a.reduce((sum, id, i) => sum + Math.abs(i - positions.get(id)!), 0);
}
export function conformity(initial: string[], final: string[]) {
  const ai = aiRanking(initial),
    pre = distance(initial, ai),
    post = distance(final, ai);
  return {
    ai,
    initialDistance: pre,
    finalDistance: post,
    bci: pre === 0 ? null : (pre - post) / pre,
    normalizedFinalDistance: post / Math.floor(initial.length ** 2 / 2),
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
