// Informational review never rewinds the server phase or reopens answered tasks.
export function reviewPages(
  phase: string,
): ('consent' | 'instructions' | 'scenario')[] {
  if (phase === 'instructions') return ['consent'];
  if (phase === 'audio' || phase === 'scenario')
    return ['instructions', 'consent'];
  if (['initial', 'revise', 'questionnaire'].includes(phase))
    return ['scenario', 'instructions', 'consent'];
  return [];
}
