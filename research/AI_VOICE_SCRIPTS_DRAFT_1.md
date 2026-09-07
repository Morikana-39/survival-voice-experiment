# AI assistant voice scripts — draft 1

Prepared 2026-09-06. Researcher-review material, not finalized stimuli.

Historical 15-item authoring draft. Superseded for the active item set on 2026-09-07: raincoat, salt and vodka are excluded. Twelve researcher-supplied fluent recordings are now installed; this document is not a verified transcript of those recordings. Refer to `PERMUTATION_AND_SCORING.md` and the current protocol for the active procedure. The draft below is preserved for provenance, not served in the experiment.

Our discussion and these instructions are in English; the spoken stimulus wording below is in Simplified Chinese. English item names and intent notes are not spoken. No audio files have been created. These files are outside the website's public assets and are not imported by its application code.

## What this draft controls

- All 15 current items, in the website's fixed discussion order.
- One item-level consideration with an explicit limitation or contextual dependency, in a neutral conversational voice. No expert credentials, persuasion command, praise, or claims to have understood the participant's typed reason.
- No numerical ranks, comparisons such as “the most important item,” or statements of agreement/disagreement with the participant.
- Identical substantive words in each matched pair. Draft 1 adds one “嗯” and one “呃” to each disfluent clip, placed inside the utterance. The added punctuation is an authoring cue, not an independently intended silent-pause manipulation.
- Two fillers per clip is a **proposal for piloting**, not a research-established ideal. Equal filler counts do not mean exactly equal rates per syllable or second when clip lengths differ.
- Existing uncertainty/context words are present in BOTH versions. Do not add extra “maybe,” “I don't know,” apologies, stutters, repetitions, laughter or “let me think” to only one condition.

## Ranking coherence: an unresolved design limitation

The AI's numerical ranking is currently produced by shifting each participant's initial ranking. A single fixed recording per item cannot justify every resulting rank. These drafts therefore express considerations, not explanations of an exact personalized rank. Balanced wording reduces explicit contradictions but does not establish that every eventual ranking will sound coherent.

Before recording, decide whether these item-level considerations are adequate for your intended conformity manipulation. If you need the voice to argue specifically for its personalized rank, we would need a separately designed bank of rank-contingent recordings or a different ranking rule; neither change is made here. Pilot the coherence and credibility of the completed interaction.

## Production instructions — do not read aloud

1. Confirm the 15-item set before generating all 30 files. If you select a 12-item subset, remove the corresponding paired scripts and update the protocol first.
2. Keep speaker identity, voice model/version, substantive pronunciation, speaking rate, volume, emotion, encoding and recording environment matched. Read quantities as written in Chinese; do not read Markdown headings, intent notes, condition labels or filenames.
3. Do not assume that generating the two complete utterances separately will produce acoustically identical speech outside the fillers. If literal waveform identity outside inserted fillers is required, use a common base recording and insert same-voice filler segments at specified boundaries; check edits for artifacts. This is a production option, not audio work performed here.
4. If you generate full clips separately, inspect differences in prosody, pronunciation and unintended silence. Document unavoidable differences instead of claiming that the waveforms differ only by fillers.
5. Filled pauses will normally add duration. Do not accelerate the disfluent clip just to force an equal total length. Measure duration, filler duration/count and non-filler speech rate after recording; decide how time-on-task is handled before the study.
6. Pilot Mandarin naturalness, audibility, the perceived fluency difference, comprehension and ranking coherence. Do not assume the wording or dose is validated simply because the pairwise text check passes.
7. The ordinary website will play one matched clip for the assigned condition after each submitted reason. It does not synthesize speech or adapt these words in real time.

## First paired draft

### 01. Flashlight — 手电筒

Intent (not spoken): Lighting and visibility; usefulness depends on light conditions.

Fluent — `public/audio/fluent/flashlight.mp3`

> 手电筒可以在光线不足的时候照明，也能用来发出光线，让别人注意到我们。不过，当前还是白天，所以我会把这些用途和眼前的环境一起考虑。

Filled pauses — `public/audio/disfluent/flashlight.mp3`

> 手电筒，嗯，可以在光线不足的时候照明，也能用来发出光线，让别人注意到我们。不过，呃，当前还是白天，所以我会把这些用途和眼前的环境一起考虑。

### 02. Folding knife — 折叠小刀

Intent (not spoken): A tool for working with other materials, rather than a direct supply of water or shelter.

Fluent — `public/audio/fluent/knife.mp3`

> 折叠小刀可以切割布料或绳索，帮助我们处理其他物品，完成一些简单的工作。不过，它本身不能提供饮水或遮蔽，所以我会考虑它能和哪些物品配合使用。

Filled pauses — `public/audio/disfluent/knife.mp3`

> 折叠小刀，嗯，可以切割布料或绳索，帮助我们处理其他物品，完成一些简单的工作。不过，呃，它本身不能提供饮水或遮蔽，所以我会考虑它能和哪些物品配合使用。

### 03. Sectional aviation map — 当地航空地图

Intent (not spoken): Geographic information is useful only if it can be interpreted and applied safely.

Fluent — `public/audio/fluent/map.mp3`

> 当地航空地图可以提供地形信息，帮助我们理解周围的环境。不过，看懂地图并不等于已经找到安全的路线，所以我会考虑我们是否具备使用这些信息的条件。

Filled pauses — `public/audio/disfluent/map.mp3`

> 当地航空地图，嗯，可以提供地形信息，帮助我们理解周围的环境。不过，呃，看懂地图并不等于已经找到安全的路线，所以我会考虑我们是否具备使用这些信息的条件。

### 04. Large plastic raincoat — 塑料雨衣

Intent (not spoken): Rain protection and covering material; use depends on conditions and setup.

Fluent — `public/audio/fluent/raincoat.mp3`

> 大号塑料雨衣既可以用于防雨，也可以作为一块覆盖材料使用。不过，防雨的作用取决于后续天气，其他用途则要看能否把它展开并固定，所以我会结合现场条件来考虑。

Filled pauses — `public/audio/disfluent/raincoat.mp3`

> 大号塑料雨衣，嗯，既可以用于防雨，也可以作为一块覆盖材料使用。不过，呃，防雨的作用取决于后续天气，其他用途则要看能否把它展开并固定，所以我会结合现场条件来考虑。

### 05. Magnetic compass — 磁性指南针

Intent (not spoken): Knowing a direction does not establish a safe destination or route.

Fluent — `public/audio/fluent/compass.mp3`

> 磁性指南针可以帮助我们辨认方向，减少对方位的混淆。不过，知道方向不等于知道哪里有救援，所以我会考虑我们是否有明确的目的地和可靠的路线。

Filled pauses — `public/audio/disfluent/compass.mp3`

> 磁性指南针，嗯，可以帮助我们辨认方向，减少对方位的混淆。不过，呃，知道方向不等于知道哪里有救援，所以我会考虑我们是否有明确的目的地和可靠的路线。

### 06. Compression kit with gauze — 急救包

Intent (not spoken): Basic wound-care materials; usefulness depends on actual injuries and needs.

Fluent — `public/audio/fluent/gauze.mp3`

> 急救包里的纱布和敷料可以在出现伤口时用于包扎，也能为处理意外提供一些材料。不过，它能发挥多大作用，还取决于是否有人受伤，以及具体需要什么帮助。

Filled pauses — `public/audio/disfluent/gauze.mp3`

> 急救包里的纱布和敷料，嗯，可以在出现伤口时用于包扎，也能为处理意外提供一些材料。不过，呃，它能发挥多大作用，还取决于是否有人受伤，以及具体需要什么帮助。

### 07. Loaded pistol — 手枪

Intent (not spoken): Possible notice through sound, weighed against uncertain reach and safety risks; no handling instruction.

Fluent — `public/audio/fluent/pistol.mp3`

> 这把已装弹的手枪可能通过声音引起附近人的注意，但声音不一定能传到有人活动的地方。同时，它还涉及使用安全，所以我会把求救的可能性和额外的风险一起考虑。

Filled pauses — `public/audio/disfluent/pistol.mp3`

> 这把已装弹的手枪，嗯，可能通过声音引起附近人的注意，但声音不一定能传到有人活动的地方。同时，呃，它还涉及使用安全，所以我会把求救的可能性和额外的风险一起考虑。

### 08. Red-and-white parachute — 降落伞

Intent (not spoken): Visible fabric and covering potential; practical use depends on deployment.

Fluent — `public/audio/fluent/parachute.mp3`

> 红白相间的降落伞颜色比较醒目，也有较大面积的布料，可以考虑遮挡和引起注意这两类用途。不过，具体能怎么利用，还要看现场能否把它展开或固定。

Filled pauses — `public/audio/disfluent/parachute.mp3`

> 红白相间的降落伞，嗯，颜色比较醒目，也有较大面积的布料，可以考虑遮挡和引起注意这两类用途。不过，呃，具体能怎么利用，还要看现场能否把它展开或固定。

### 09. Bottle of salt tablets — 盐片

Intent (not spoken): Do not infer usefulness from quantity or treat tablets as water; use requires appropriate conditions.

Fluent — `public/audio/fluent/salt.mp3`

> 这瓶盐片与补充盐分有关，但不能代替饮用水，也不适合仅凭天气炎热就随意服用。所以，我会先考虑它是否适合当前情况，而不是因为有一千片，就直接判断它更有价值。

Filled pauses — `public/audio/disfluent/salt.mp3`

> 这瓶盐片，嗯，与补充盐分有关，但不能代替饮用水，也不适合仅凭天气炎热就随意服用。所以，呃，我会先考虑它是否适合当前情况，而不是因为有一千片，就直接判断它更有价值。

### 10. Approximately 0.95 litres of water — 饮用水

Intent (not spoken): A direct but limited drinking-water supply for a group; no rationing instruction.

Fluent — `public/audio/fluent/water.mp3`

> 这份饮用水能够提供直接的饮水补给，但总量只有大约零点九五升，需要放在整个团队的需求中考虑。所以，我会同时看它能解决什么问题，以及这一有限的数量能支持到什么程度。

Filled pauses — `public/audio/disfluent/water.mp3`

> 这份饮用水，嗯，能够提供直接的饮水补给，但总量只有大约零点九五升，需要放在整个团队的需求中考虑。所以，呃，我会同时看它能解决什么问题，以及这一有限的数量能支持到什么程度。

### 11. Edible Animals of the Desert — 《沙漠中的可食用动物》

Intent (not spoken): Information about food is not the same as obtaining usable food.

Fluent — `public/audio/fluent/book.mp3`

> 《沙漠中的可食用动物》这本书可能提供辨认相关动物的信息，但拥有这些信息，不等于就能找到或获得食物。所以，我会考虑我们是否有时间和条件，把书里的内容实际用起来。

Filled pauses — `public/audio/disfluent/book.mp3`

> 《沙漠中的可食用动物》这本书，嗯，可能提供辨认相关动物的信息，但拥有这些信息，不等于就能找到或获得食物。所以，呃，我会考虑我们是否有时间和条件，把书里的内容实际用起来。

### 12. Sunglasses — 太阳镜

Intent (not spoken): Protection from glare; a specific benefit rather than a replacement for other supplies.

Fluent — `public/audio/fluent/sunglasses.mp3`

> 太阳镜可以减轻强光带来的不适，帮助我们在明亮的环境中观察周围。不过，它主要作用在眼部，不能代替其他补给，所以我会把这种保护和团队的其他需要一起考虑。

Filled pauses — `public/audio/disfluent/sunglasses.mp3`

> 太阳镜，嗯，可以减轻强光带来的不适，帮助我们在明亮的环境中观察周围。不过，呃，它主要作用在眼部，不能代替其他补给，所以我会把这种保护和团队的其他需要一起考虑。

### 13. Approximately 1.9 litres of 90% ABV vodka — 伏特加

Intent (not spoken): Distinguish alcohol from drinking water, and the liquid from its container; avoid unsafe uses.

Fluent — `public/audio/fluent/vodka.mp3`

> 这份伏特加虽然也是液体，但不能当成普通的饮水补给，而且标注的酒精浓度达到百分之九十。所以，我会区分酒液和容器各自可能的用途，同时考虑携带和使用中的风险。

Filled pauses — `public/audio/disfluent/vodka.mp3`

> 这份伏特加，嗯，虽然也是液体，但不能当成普通的饮水补给，而且标注的酒精浓度达到百分之九十。所以，呃，我会区分酒液和容器各自可能的用途，同时考虑携带和使用中的风险。

### 14. Topcoat — 厚外套

Intent (not spoken): Covering and warmth under some conditions, with a carrying burden in present heat.

Fluent — `public/audio/fluent/coat.mp3`

> 厚外套可以用来覆盖身体，在需要保暖的时候也可能派上用场。不过，现在是炎热的白天，所以我会同时考虑它可能提供的保护，以及携带它带来的负担。

Filled pauses — `public/audio/disfluent/coat.mp3`

> 厚外套，嗯，可以用来覆盖身体，在需要保暖的时候也可能派上用场。不过，呃，现在是炎热的白天，所以我会同时考虑它可能提供的保护，以及携带它带来的负担。

### 15. Cosmetic mirror — 化妆镜

Intent (not spoken): Reflected sunlight can attract attention, but detection depends on someone seeing it.

Fluent — `public/audio/fluent/mirror.mp3`

> 化妆镜可以借助阳光反射光线，让别人有机会注意到我们的位置。不过，能否被看见，还要看周围有没有能够接收到信号的人，所以我会把这种用途和现场条件一起考虑。

Filled pauses — `public/audio/disfluent/mirror.mp3`

> 化妆镜，嗯，可以借助阳光反射光线，让别人有机会注意到我们的位置。不过，呃，能否被看见，还要看周围有没有能够接收到信号的人，所以我会把这种用途和现场条件一起考虑。

## Safety/content checks

These are original fictional-task stimuli, not reproduced advice from Nass et al., a validated answer key or real-world survival training. They avoid dosage instructions, hunting instructions, weapon-handling directions, drinking alcohol as hydration, and using high-proof alcohol on wounds.

Broad equipment context was checked against the National Park Service's [Grand Canyon Hike Smart guidance](https://www.nps.gov/grca/planyourvisit/hike-smart.htm) and [White Sands safety guidance](https://www.nps.gov/whsa/planyourvisit/safety.htm): water, first aid, maps, lighting and weather-appropriate protection are context-dependent preparedness considerations; the Grand Canyon page also lists a signal mirror. Neither page validates this experiment, its rankings, or all of these improvised uses. The Grand Canyon [summer backpacking brochure](https://www.nps.gov/grca/planyourvisit/upload/Hike_Smart_Summer_Backpacking-pdf.pdf) cautions about electrolyte/salt replacement tablets; the salt wording deliberately does not prescribe using them.

Keep these source notes out of the participant audio. Obtain a subject-matter review if the final stimuli are intended to represent expert survival advice.

## Local edits versus the hosted website

The public website is a separately published version, not a real-time mirror of this folder. Changes can appear promptly in a running LOCAL development server, but the hosted site changes only after a new build/version is published. Editing this document or the companion JSON neither updates the site nor changes any existing MP3. Once wording and audio are approved, the actual recordings must be added to the expected paths and published in a new website version.

This turn adds authoring documents only. No application code, public access permissions, participant records or deployment has been changed.
