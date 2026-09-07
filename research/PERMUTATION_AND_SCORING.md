# Fixed 12-item mapping and scoring

Selected 2026-09-07. Protocol `survival-voice-v1.2-12items`; permutation `rank12-irregular-2026-09-07`; scoring `footrule-gap-closure-v1`. Pilot/preregistration decisions remain required before collection. No participant data were used to select this mapping.

## Direction matters

Each **initial position**, not an item identity, maps to one AI destination position. If water was initially first, AI places water third; if water was initially sixth, AI places it fourth. The discussion order remains the fixed 12-item list in the protocol, independent of this mapping.

| Initial position | AI position | Absolute displacement |
| --- | --- | --- |
| 1 | 3 | 2 |
| 2 | 6 | 4 |
| 3 | 8 | 5 |
| 4 | 1 | 3 |
| 5 | 10 | 5 |
| 6 | 4 | 2 |
| 7 | 2 | 5 |
| 8 | 11 | 3 |
| 9 | 5 | 4 |
| 10 | 12 | 2 |
| 11 | 9 | 2 |
| 12 | 7 | 5 |

For an initial order `[a,b,c,d,e,f,g,h,i,j,k,l]`, the AI display order is `[d,g,a,f,i,b,l,c,k,e,h,j]`. Do not mistakenly use the destination array as the AI display order.

## Design checks and limitations

- All destinations 1–12 occur exactly once; no unchanged positions.
- Displacements range from 2 to 5, mean 3.5, total 42. Similar, not equal, displacement balances disagreement against an irregular mapping.
- Maximum 12-item footrule distance is 72; 42/72 = 0.5833. Rank correlation is approximately 0.4196. There are 23 inverted pairs out of 66 (34.85%). These support a moderate-disagreement interpretation; they are not a validated psychological threshold.
- The mapping forms one 12-cycle, not repeated pair swaps. It is neither reversal nor a fixed arithmetic/circular shift; adjacent source ranks never have adjacent AI destinations. No finite permutation can be guaranteed unrecognizable. Pilot perceived credibility, disagreement and pattern detection, then freeze before recruitment.
- The same permutation applies in both conditions and to every study participant. No per-participant permutation search or randomization is performed. Thus pre-discussion distance is exactly 42 regardless of the initial item order.
- Rank-level control is not semantic control: prerecorded reasons may appear inconsistent with an individualized AI ranking. Avoid numeric ranks or absolute recommendations in recordings; pilot this issue. The selected subset and mapping are adaptations, not an exact replication of Nass et al.'s unspecified full mapping. Keeping 12 items alone does not establish identical methodological validity.

## Scoring and interpretation

For each item j, let I_j, A_j and F_j denote its initial, AI and final ranks. Define D_pre = sum(abs(I_j − A_j)) = 42 and D_post = sum(abs(F_j − A_j)). This is Spearman footrule distance; normalization by its maximum yields a distance in 0–1. For 12 complete rankings the maximum is 12²/2 = 72. See the primary [rank aggregation paper by Dwork et al.](https://www.wisdom.weizmann.ac.il/~naor/PAPERS/rank_www10.html), which defines this normalization; the study-specific adaptations below are not attributed to that paper or to Nass.

### Recommended non-clipped change measure

`bci = (42 − D_post) / 42`

1 means complete agreement; 0 means no net reduction in disagreement (not necessarily an unchanged ranking); negative values mean movement away. The range is −30/42 = −5/7 through 1. This is **not** a 0–1 measure. Keeping negative values preserves counter-conformity information and avoids creating a pile-up at zero by clipping.

### Bounded positive-conformity measure

`positiveConformity01 = max(0, (42 − D_post) / 42)`

This is the proportion of the initial disagreement eliminated, floored at zero. It is an explicitly defined operational index, not a newly validated psychometric scale. It is bounded 0–1 but treats no reduction and increased disagreement identically; do not interpret zero as proof that the participant made no changes. Preregister whether this is a primary or secondary outcome before inspecting group differences.

| Final distance | Unclipped BCI | Positive conformity 0–1 | Interpretation |
| --- | --- | --- | --- |
| 42 | 0 | 0 | No net gap reduction |
| 28 | 0.3333 | 0.3333 | One third of initial gap closed |
| 14 | 0.6667 | 0.6667 | Two thirds closed |
| 0 | 1 | 1 | AI ranking fully adopted |
| 56 | −0.3333 | 0 | Increased disagreement, hidden by clipping |
| 72 | −0.7143 | 0 | Maximum disagreement |

Distances between complete rankings are even integers, so scores are discrete, not continuously measured. Positive gap closure changes in units of 2/42 = 1/21, subject to attainable rankings. Do not describe this score as a probability of obeying or a percentage of items adopted.

### Separate final alignment 0–1

`alignment01 = 1 − D_post / 72`

This describes final similarity, not change. An unchanged initial ranking has alignment 1 − 42/72 = 0.4167, not zero. With the fixed initial distance it is an affine transformation of non-clipped BCI: `alignment01 = 5/12 + (7/12) × bci`. Thus the two non-clipped indices retain the same ordering/information, while the clipped positive index does not. If an analysis requires an information-preserving 0–1 index, report alignment with this correct interpretation.

## Storage and version handling

All three raw rankings, both raw distances, BCI, positive conformity, final alignment, changed-item count and scoring/permutation IDs are stored on completion and included in the researcher export. Preview records are always excluded, even when all clips were heard. Incomplete/withdrawn/skipped-audio study records are excluded. Older records retain their own count and previously saved metrics; newly introduced metrics remain blank for old records, rather than being recomputed under this mapping. Old 15-item previews require an explicit restart, which creates a new record and preserves the old one.

## Audio status

Only the 12 selected MP3 entries from the supplied fluent.zip were imported, without conversion or editing. The ZIP and its three excluded recordings remain untouched outside the site. The imported clips are mono MP3 at 48 kHz, approximately 11–17 seconds each. Technical format/decoding checks are not a listening, transcript, intelligibility or manipulation validation. The historical draft scripts are not verified transcripts. The 12 disfluent counterparts, source-provider details and matched-pair review remain pending. Preview clearly auditions fluent speech only; real collection remains disabled with no fallback or generated substitute.
