# Experiment protocol — first version

Status: researcher preview, not open for recruitment. UI is Simplified Chinese; documentation is English. No voice files have been generated or substituted. Preview responses are saved separately and excluded from research exports.

## Workflow

1. **Informed consent.** Present purpose in neutral terms, procedures, estimated 20–30 minutes, voluntary participation, data handling, withdrawal, and delayed disclosure. Require adult eligibility and consent. No study session is created before consent.
2. **Basic information.** Collect age (18–100) and gender, including a prefer-not-to-say option. Real participants enter an individually issued invitation code. Create a server-side session and assign fluent/disfluent with independent 50:50 probability; this does not guarantee exactly equal group sizes.
3. **Instructions.** Explain independent decisions, sequential discussion with a prerecorded AI voice assistant, final ranking and questionnaire. Do not reveal speech-fluency manipulation.
4. **Sound check.** Play 2–5 randomly selected short test tones. Require the correct count after enough time has elapsed. Explain that device and browser-tab sound must remain on.
5. **Scenario.** Chinese-language Sonoran Desert crash scenario, framed as travelling in the southwestern United States. Retain the desert setting, use familiar metric quantities, and clearly label the task as fictional.
6. **Initial ranking.** Fifteen numbered vertical boxes, 1 = most important. Desktop dragging, tap-to-place and up/down controls are available. Require a complete permutation, then explicit confirmation. Save and lock this initial ranking.
7. **Information exchange.** Fixed order below, identical in both conditions and independent of each participant's ranking. Show an arrow beside the current item in the initial-ranking reference. Require a brief typed reason (2–500 characters), save it, then play that item's assigned prerecorded response. The ordinary study interface allows continuation only after full playback and a heard-audio confirmation. Preview mode instead has an explicitly labelled no-audio skip. Reveal no complete AI ranking during this phase.
8. **Final ranking.** Only after all 15 discussions, show initial and AI rankings side by side and an editable final ranking. Allow no change as a valid choice. Require explicit confirmation.
9. **Social presence.** Five required items, each on a seven-point agreement scale. Confirm final submission. Store one completion atomically; retries with the same action ID return the same result. New submissions cannot change a completed session.
10. **Debrief.** Explain the withheld fluency manipulation, prerecorded responses and algorithmically constructed AI ranking. Display a completion code and researcher contact when configured.

Confirmed stages survive refresh. Unconfirmed browser drafts are convenience data, not authoritative research records. Interrupted playback must restart. Withdrawing before submission clears recorded answers and demographics but retains the used-code state.

## Stimuli and fixed discussion order

The supplied Nass et al. paper repeatedly refers to 12 items, but the listed item footnote contains 15. This pilot keeps all 15 listed items; **confirm 15, or identify exactly three exclusions, before collecting data**. Changing count also requires updating the export/audio checks, testing and freezing a new protocol version.

| Order / audio ID | Chinese participant label | Specification |
| --- | --- | --- |
| 1 `flashlight` | 手电筒 | 4 batteries |
| 2 `knife` | 折叠小刀 | One folding knife |
| 3 `map` | 当地航空地图 | Sectional aviation map |
| 4 `raincoat` | 塑料雨衣 | Large |
| 5 `compass` | 磁性指南针 | One |
| 6 `gauze` | 急救包 | Gauze and compression dressings |
| 7 `pistol` | 手枪 | Loaded, .45 inch ≈ 11.4 mm |
| 8 `parachute` | 降落伞 | Red and white |
| 9 `salt` | 盐片 | Bottle of 1,000 |
| 10 `water` | 饮用水 | Approximately 0.95 L (one US quart) |
| 11 `book` | 《沙漠中的可食用动物》 | One book |
| 12 `sunglasses` | 太阳镜 | One pair |
| 13 `vodka` | 伏特加 | Approximately 1.9 L, 90% ABV (180 proof) |
| 14 `coat` | 厚外套 | One coat |
| 15 `mirror` | 化妆镜 | One mirror |

The scenario includes pilot assumptions that all travellers can move normally and communications are unavailable. These are adaptations, not verbatim source wording. Review and freeze the whole Chinese scenario together with the stimuli.

## AI ranking and conformity

An item at initial rank `r` receives AI rank `((r - 1 + 3) mod 15) + 1`. This matches the paper's illustrative 2→5 example and yields constant initial Spearman footrule distance 72, but the **complete cyclic permutation is our pilot design choice, not a full mapping recovered from Nass et al.** Revealing the AI ranking only after discussion follows your revised procedure, not an exact replication of the earlier study.

All three raw rankings are retained. With `D(A,B) = Σ |rank_A(item) - rank_B(item)|`:

`BCI = [D(initial, AI) - D(final, AI)] / D(initial, AI)`

BCI = 1 means full alignment, 0 means no net movement toward AI, and negative means movement away. Final distance and changed-item count are also saved. This normalized change measure is an adaptation; the source study's final-disagreement measure should not be described as this exact formula. Decide and preregister the primary outcome before recruitment.

Because AI rank depends on the participant, a single fixed recording per item should discuss that item's possible usefulness without stating a numerical AI rank. Otherwise the prerecorded advice may contradict the derived ranking. Review this coherence before approving stimuli.

## Social presence

Adapted Chinese wording appears in `lib/protocol.ts`. SP1–SP5 cover personalness, human contact, real person, sociability, and human sensitivity. Each response is 1–7, from 非常不同意 to 非常同意. No reverse-coded item is included.

**Source caveat:** Pitardi & Marriott (2021), Table 1, printed p.633, includes five candidate social-presence items but marks SP1 as deleted. The requested five-item version is retained here. The database stores both the five-item mean and the SP2–SP5 mean for transparent secondary comparison. Do not choose between them after seeing significant results. The Chinese adaptation needs translation review, a pilot and reliability assessment; the original paper's psychometrics do not automatically validate this version.

## Audibility: what the website can and cannot enforce

The live interface gates playback completion and detects HTML media-element mute/zero volume, playback-rate changes, forward seeking and page-hiding interruptions. Autoplay rejection shows a manual play button. These checks plus the tone-count challenge reduce accidental inaudible participation.

**A normal website cannot reliably read system volume, hardware mute or browser-tab mute.** Successful playback does not prove the sound reached the participant. Do not state that device muting makes progression impossible. Client playback telemetry can also be forged; this is a behavioral compliance check, not anti-tampering proof. A content comprehension check could be added after a pilot, if preregistered.

Technical references: [HTMLMediaElement volume](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volume), [volumechange event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/volumechange_event).

## Repeat participation and data handling

- Issue one random 128-bit invitation code per eligible person. The server stores its SHA-256 hash, not the plaintext code. An atomic unique database constraint limits each code to one session, including after withdrawal.
- An HttpOnly, SameSite cookie lets the same browser resume. A completed session remains locked; the client completion marker is not the security boundary.
- A used code in another browser is rejected. Recruiters must avoid issuing multiple codes to one person. The website cannot prove human identity across new codes/devices, and does not collect fingerprints or IP addresses in the research dataset.
- Host infrastructure may process connection metadata. Consent/privacy review must account for the hosting location and provider; absence of IP fields in study tables does not imply the host keeps no network logs.
- Keep incomplete sessions for operational recovery until the approved retention deadline; omit them from analysis. Withdrawn responses and demographics are cleared immediately. The researcher remains responsible for enforcing the final retention/deletion policy.
- Export includes only complete, eligible study-mode records with all 15 audio exposures and no preview skips. No data-quality thresholds beyond completeness are invented. Decide attention, speed and exclusion rules before data collection.

## Launch gates and costs

Before opening: finalize count, Chinese scenario, mapping and outcome; approve consent, ethics/debrief and retention; provide institution/contact details; upload and validate matched audio; choose recruitment platforms and one-code-per-person process; pilot playback on actual Android/iOS and China-network browsers; review hosting access, data location, quotas and free-plan settings. Until then `STUDY.open`, `consentApproved` and `stimuliApproved` remain false.

No claim of free unlimited hosting is made. No paid AI/TTS APIs, domains or services are configured. Stay within the existing account's free allowances and do not enable paid upgrades. See [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) before any independent Cloudflare deployment. This first publication is owner-private, not a public recruitment link.
