# Survival voice experiment

First runnable version of a Chinese-language, two-condition between-subjects study. Built with React, TypeScript, Vinext/Vite, a Cloudflare-compatible worker and SQLite/D1 persistence; hosted through Sites. Existing ornamental PNG frame and warm-brown responsive styling are preserved.

**Current mode:** researcher preview. No AI audio has been generated. Live participation is deliberately disabled. Preview records never enter the analysis export.

Read `EXPERIMENT_WORKFLOW.md` for the protocol and limitations; `METHODS_DRAFT.md` for research-writing wording that distinguishes implemented details from decisions still pending.

## Local development

Requires Node 22.13+ and pnpm. Dependency versions remain locked.

```sh
pnpm install --frozen-lockfile
pnpm db:local
pnpm dev
```

Open `http://localhost:3000`. The local development database is separate from the hosted database. Changing source or copying the project folder does not copy hosted responses. Do not put research records in Git.

```sh
pnpm exec tsc --noEmit
node scripts/run-tests.mjs
node scripts/test-data.mjs
node scripts/test-api.mjs
pnpm build
```

API checks require a running local server and create synthetic preview sessions only. Do not run them against real collection. The audio checker intentionally fails until all required clips exist.

## Add your prerecorded audio later

Place these files in both `public/audio/fluent/` and `public/audio/disfluent/`:

```text
flashlight.mp3  knife.mp3       map.mp3       raincoat.mp3
compass.mp3     gauze.mp3       pistol.mp3    parachute.mp3
salt.mp3        water.mp3       book.mp3      sunglasses.mp3
vodka.mp3       coat.mp3        mirror.mp3
```

Run `pnpm check:audio`. It checks presence and nontrivial size, not perceptual matching, intelligibility or waveform quality. Real session creation also checks deployed audio paths. A researcher must approve actual content and test playback on target devices. Use the same voice, words, loudness, encoding and delivery; insert only the planned filled pauses in the disfluent variant. Do not use device TTS as a substitute. Document timing differences caused by the inserted pauses and your audio-generation provider/version.

Keep scripts independent of the participant's typed reason and exact numerical ranking; there is no runtime language-model response. The debrief makes this clear. `lib/audio-manifest.ts` maps the files; `lib/study-config.ts` contains launch gates. The current owner-private preview uses labelled placeholders even if clips are present.

## Invitation codes

After protocol approval, generate codes locally:

```sh
pnpm invitations 100
```

This writes `private-invitations/invitations.csv` for individual distribution and `invitations.sql` containing only hashes for database import. These directories are ignored by Git. Import SQL into the selected study database through authenticated administration, not a participant-facing endpoint. For a local dry run only:

```sh
pnpm exec wrangler d1 execute DB --local --config wrangler.local.json --file private-invitations/invitations.sql
```

One code can start one session. Another code could be used by the same human; responsible recruitment is still required. The 500-session ceiling is an operational cap, not a sample-size calculation or guaranteed cost limit.

## Exporting data

There is no public data/admin endpoint. Use authenticated database administration to export a JSON query result. Prefer `SELECT id, mode, status, version, condition, age, gender, state, metrics, created_at, completed_at FROM sessions` to omit authorization and invitation hashes. Save the raw query result in an ignored private directory, then:

```sh
pnpm export:data private-export/source-query.json private-export/analysis-01
```

Four UTF-8 CSVs contain participant-level outcomes, all three rankings, discussion/audio records, and SP1–SP5. Preview, incomplete, withdrawn and skipped-audio records are excluded. Files are never silently overwritten. Keep the original query if timing/event-level analysis is needed. Treat typed responses as potentially identifying despite the instruction not to include personal details.

## Verification and release boundary

Automated protocol/API checks cover order, ranking integrity, concealment, recovery, idempotency, blocked resubmission and withdrawal. Static types and a production build are also checked. Browser visual/device QA and actual voice playback have not been performed. Optional preview-only WebMCP hooks expose stage inspection and preview restart, never a live-session tool; their supported-browser integration has not been tested.

Do not distribute this private preview as the live study. A public, China-accessible recruitment deployment, approved study documents, matched audio and a target-device pilot are separate launch steps. No paid API or upgrade is required by the application code, and none has been configured.
