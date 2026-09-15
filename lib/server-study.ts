import { env } from 'cloudflare:workers';
import { STUDY, collectionReady } from './study-config';
import { REQUIRED_AUDIO } from './audio-manifest';
import { view } from './session-view';
export { view } from './session-view';
import {
  VERSION,
  isEligibleAge,
  freshState,
  type Condition,
  type Mode,
} from './protocol';

export type SessionRow = {
  id: string;
  auth_hash: string;
  token_hash: string | null;
  mode: Mode;
  condition: Condition;
  version: string;
  revision: number;
  status: string;
  age: number | null;
  gender: string | null;
  state: string;
  created_at: string;
  completed_at: string | null;
  completion_code: string | null;
  submission_key: string | null;
  last_action_id: string | null;
  metrics: string | null;
};
export const db = () => (env as unknown as { DB: D1Database }).DB;
export const hash = async (value: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
export const randomKey = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
export class StudyError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const json = (body: unknown, status = 200, cookie?: string) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...(cookie ? { 'Set-Cookie': cookie } : {}),
    },
  });
export async function bodyOf(
  request: Request,
): Promise<Record<string, unknown>> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new StudyError('请在实验网页中操作。', 403);
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new StudyError('请求格式不正确。', 415);
  const raw = await request.text();
  if (raw.length > 120_000) throw new StudyError('提交内容过长。', 413);
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw 0;
    return value;
  } catch {
    throw new StudyError('无法读取提交内容。');
  }
}
export async function findSession(request: Request) {
  const key = request.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('sv_session='))
    ?.slice(11);
  if (!key || !/^[a-f0-9]{64}$/.test(key)) return null;
  return db()
    .prepare('SELECT * FROM sessions WHERE auth_hash = ?')
    .bind(await hash(key))
    .first<SessionRow>();
}
export const failure = (error: unknown) =>
  json(
    {
      error:
        error instanceof StudyError
          ? error.message
          : '暂时无法连接，请稍后重试。您的已确认进度会保留。',
    },
    error instanceof StudyError ? error.status : 503,
  );
export function studyConfigured() {
  return collectionReady(STUDY);
}
export async function checkAssets(request: Request) {
  // Check the exact deployed asset set before accepting a real participant.
  const missing: string[] = [];
  for (const clip of [{ path: '/audio/warmup.mp3' }, ...REQUIRED_AUDIO]) {
    const result = await fetch(new URL(clip.path, request.url), {
      method: 'HEAD',
    });
    if (!result.ok || !result.headers.get('content-type')?.startsWith('audio/'))
      missing.push(clip.path);
  }
  return missing;
}
export async function createSession(
  request: Request,
  b: Record<string, unknown>,
) {
  const requestedTestCondition: Condition | null =
    b.testCondition === 'fluent' || b.testCondition === 'disfluent'
      ? b.testCondition
      : null;
  const mode: Mode = requestedTestCondition ? 'preview' : 'study';
  const existing = await findSession(request);
  if (
    existing &&
    existing.mode === mode &&
    (mode === 'study' || existing.condition === requestedTestCondition)
  )
    return json({ session: view(existing) });
  if (
    b.consent !== true ||
    !isEligibleAge(b.age) ||
    !['woman', 'man'].includes(String(b.gender))
  )
    throw new StudyError('请确认参与同意，并填写有效的年龄和性别选项。');
  let tokenHash: string | null = null;
  if (mode === 'study') {
    if (!studyConfigured())
      throw new StudyError('正式实验尚未开放，请等待研究人员通知。', 403);
    if (
      typeof b.invitation !== 'string' ||
      !/^SV-[A-F0-9]{32}$/i.test(b.invitation)
    )
      throw new StudyError('请输入研究人员发放的有效参与码。');
    tokenHash = await hash(b.invitation.toUpperCase());
    if (
      !(await db()
        .prepare('SELECT token_hash FROM invitations WHERE token_hash = ?')
        .bind(tokenHash)
        .first())
    )
      throw new StudyError('参与码无效。');
    if (
      await db()
        .prepare('SELECT id FROM sessions WHERE token_hash = ?')
        .bind(tokenHash)
        .first()
    )
      throw new StudyError(
        '此参与码已使用。请在原浏览器继续，或联系研究人员。',
        409,
      );
    if ((await checkAssets(request)).length)
      throw new StudyError('实验音频尚未准备完毕。请稍后再参加。', 503);
  }
  const key = randomKey(),
    now = new Date().toISOString(),
    id = crypto.randomUUID();
  const condition: Condition =
    requestedTestCondition ??
    (crypto.getRandomValues(new Uint8Array(1))[0] < 128
      ? 'fluent'
      : 'disfluent');
  const state = JSON.stringify(freshState(now));
  try {
    const result = await db()
      .prepare(`INSERT INTO sessions (id, auth_hash, token_hash, mode, condition, version, revision, status, age, gender, state, created_at)
      SELECT ?, ?, ?, ?, ?, ?, 0, 'active', ?, ?, ?, ?
      WHERE ? = 'preview' OR (SELECT count(*) FROM sessions WHERE mode = 'study') < ?`)
      .bind(
        id,
        await hash(key),
        tokenHash,
        mode,
        condition,
        VERSION,
        b.age,
        b.gender,
        state,
        now,
        mode,
        STUDY.maxStudySessions,
      )
      .run();
    if (!result.meta.changes) throw new StudyError('本研究参与名额已满。', 403);
  } catch (error) {
    if (error instanceof StudyError) throw error;
    throw new StudyError(
      '参与码已被使用，或连接暂时不可用。请刷新后重试。',
      409,
    );
  }
  const row = await db()
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .bind(id)
    .first<SessionRow>();
  return json(
    { session: view(row!) },
    201,
    `sv_session=${key}; HttpOnly; SameSite=Strict; Path=/; Max-Age=7776000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
  );
}
