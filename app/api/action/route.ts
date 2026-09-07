import {
  bodyOf,
  db,
  failure,
  findSession,
  json,
  StudyError,
  view,
  type SessionRow,
} from '@/lib/server-study';
import { applyAction, ActionError } from '@/lib/actions';
import { VERSION, conformity, type State } from '@/lib/protocol';

export async function POST(request: Request) {
  try {
    const b = await bodyOf(request),
      row = await findSession(request);
    if (!row) throw new StudyError('会话已失效，请刷新页面。', 401);
    if (row.version !== VERSION && b.action !== 'withdraw')
      throw new StudyError(
        '实验内容已更新。请刷新页面；旧版预览需要重新开始。',
        409,
      );
    if (typeof b.actionId !== 'string' || !/^[a-f0-9-]{36}$/.test(b.actionId))
      throw new StudyError('提交标识无效。');
    if (row.last_action_id === b.actionId) {
      const state: State = JSON.parse(row.state);
      return json({
        session: view(row),
        ...(b.action === 'tone_start' ? { beeps: state.audioCount } : {}),
      });
    }
    if (row.status !== 'active')
      throw new StudyError('本次实验已结束，无法再次提交。', 409);
    if (b.revision !== row.revision)
      throw new StudyError('进度已在其他页面更新。请刷新后继续。', 409);
    const now = Date.now();
    let state: State;
    try {
      state = applyAction(
        JSON.parse(row.state),
        row.mode,
        b,
        now,
        2 + (crypto.getRandomValues(new Uint8Array(1))[0] % 4),
      );
    } catch (e) {
      if (e instanceof ActionError) throw new StudyError(e.message);
      throw e;
    }
    const complete = state.phase === 'complete',
      withdrawn = state.phase === 'withdrawn';
    const code = complete
      ? `DONE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
      : null;
    const metrics = complete
      ? JSON.stringify({
          ...conformity(state.initial, state.final),
          socialPresence5: state.questionnaire.reduce((a, v) => a + v, 0) / 5,
          socialPresence4:
            state.questionnaire.slice(1).reduce((a, v) => a + v, 0) / 4,
          eligible: row.mode === 'study',
        })
      : null;
    const result = await db()
      .prepare(
        `UPDATE sessions SET state = ?, revision = revision + 1, status = ?, completed_at = ?, completion_code = ?, submission_key = ?, last_action_id = ?, metrics = ?, age = ?, gender = ? WHERE id = ? AND revision = ? AND status = 'active'`,
      )
      .bind(
        JSON.stringify(state),
        complete ? 'complete' : withdrawn ? 'withdrawn' : 'active',
        complete || withdrawn ? new Date(now).toISOString() : null,
        code,
        complete ? b.actionId : null,
        b.actionId,
        metrics,
        withdrawn ? null : row.age,
        withdrawn ? null : row.gender,
        row.id,
        row.revision,
      )
      .run();
    const updated = await db()
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .bind(row.id)
      .first<SessionRow>();
    if (!result.meta.changes && updated?.last_action_id !== b.actionId)
      throw new StudyError('进度已更新。请刷新页面继续。', 409);
    return json({
      session: view(updated!),
      ...(b.action === 'tone_start' ? { beeps: state.audioCount } : {}),
    });
  } catch (e) {
    return failure(e);
  }
}
