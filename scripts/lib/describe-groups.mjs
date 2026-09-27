// Descriptive statistics only. Saved participant scores are never recalculated.
export function describeGroups(participants) {
  const keys = [
    'version',
    'item_count',
    'permutation_id',
    'scoring_version',
    'condition',
  ];
  const measures = [
    'age',
    'bci',
    'positive_conformity_01',
    'alignment_01',
    'social_presence_5',
    'social_presence_4',
    'changed_items',
  ];
  const groups = new Map();
  for (const participant of participants) {
    const key = JSON.stringify(keys.map((name) => participant[name]));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(participant);
  }
  return [...groups.values()].flatMap((group) =>
    measures.map((measure) => {
      const values = group
        .map((row) => row[measure])
        .filter((v) => typeof v === 'number' && Number.isFinite(v));
      const n = values.length;
      const mean = n ? values.reduce((a, b) => a + b, 0) / n : null;
      return {
        ...Object.fromEntries(keys.map((key) => [key, group[0][key]])),
        group_n: group.length,
        measure,
        n,
        missing_n: group.length - n,
        mean,
        sample_sd:
          n > 1
            ? Math.sqrt(
                values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
                  (n - 1),
              )
            : null,
        min: n ? Math.min(...values) : null,
        max: n ? Math.max(...values) : null,
      };
    }),
  );
}
