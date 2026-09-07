import { audioPath } from './audio-manifest';
import {
  VERSION,
  DISCUSSION_ORDER,
  aiRanking,
  type State,
  type View,
} from './protocol';
import type { SessionRow } from './server-study';

// Old records are preserved, never recalculated with a newer item set or mapping.
export function view(row: SessionRow): View {
  const s: State = JSON.parse(row.state);
  const mismatch = row.version !== VERSION;
  const index = mismatch ? 0 : s.exposures.length;
  const currentItem = mismatch ? null : (DISCUSSION_ORDER[index] ?? null);
  const reveal =
    !mismatch && ['revise', 'questionnaire', 'complete'].includes(s.phase);
  return {
    id: row.id,
    mode: row.mode,
    protocolMismatch: mismatch && s.phase !== 'withdrawn',
    revision: row.revision,
    phase: s.phase,
    initial: mismatch ? [] : s.initial,
    final: mismatch ? [] : s.final,
    ai: reveal ? aiRanking(s.initial) : null,
    discussionIndex: index,
    currentItem,
    reason: mismatch ? null : (s.reasons[index]?.text ?? null),
    // Preview deliberately auditions fluent clips only, clearly labelled in the UI.
    audioSrc:
      !mismatch && s.reasons[index] && currentItem
        ? audioPath(
            row.mode === 'preview' ? 'fluent' : row.condition,
            currentItem,
          )
        : null,
    audioCheckPassed: !mismatch && s.audioPassed,
    questionnaire: mismatch ? [] : s.questionnaire,
    completionCode: row.completion_code,
  };
}
