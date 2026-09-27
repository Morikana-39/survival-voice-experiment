# Analysis on another computer

The project contains the experiment source and offline conversion tools. GitHub
does not contain participant responses, database backups, invitation lists, or
credentials. Publishing this repository does not deploy the live experiment.

## 1. Download the project

Sign into GitHub as `Morikana39` (or an account granted access), open the private
`survival-voice-experiment` repository, and choose **Code > Download ZIP**. Extract
the ZIP and open a terminal in its top-level folder, where `package.json` lives.
Alternatively, with Git and authenticated GitHub CLI installed:

```sh
gh auth login
gh repo clone Morikana39/survival-voice-experiment
cd survival-voice-experiment
```

Install Node.js 22.13 or newer from https://nodejs.org/ and verify:

```sh
node --version
```

**For conversion and descriptive summaries, no npm/pnpm installation or website
server is needed.** These commands use Node's built-in modules and work on Windows,
macOS, and Linux. They never connect to or update the study database.

## 2. Obtain a private JSON data snapshot

Transfer an existing `source-query.json` securely from your original computer into
`private-export/source-query.json`. Create the `private-export` folder if needed.
Do not put participant data in GitHub, including this private repository.

If you need a fresh snapshot, responses live in **Cloudflare D1**, even when the
website is accessed through Vercel. An authorized administrator can export the
JSON result of this read-only query from database `survival-voice-db`:

```sql
SELECT id, mode, status, version, condition, age, gender,
       state, metrics, created_at, completed_at
FROM sessions
ORDER BY created_at, id;
```

Save the query rows as UTF-8 JSON. The converter accepts a row array, a
`{"results": [...]}` object, or Wrangler's `[{"results": [...]}]` format.
A SQL backup, screenshot, or CSV file is not an input for this converter.
This query deliberately omits authentication and invitation hashes.

For command-line export, install the project dependencies with
`npx pnpm@10 install --frozen-lockfile`, then authenticate to the correct Cloudflare
account with `npx wrangler login`. Run the query using the cross-platform helper:

```sh
node scripts/download-data.mjs private-export/source-query.json
```

The helper runs only the fixed SELECT above, against the remote D1 binding in
`wrangler.local.json`; it refuses to overwrite an existing file. It requires the
installed Wrangler dependency and database access, unlike offline conversion.
Never run migrations, imports, or DELETE/UPDATE statements to prepare an analysis.

## 3. Convert and summarize

```sh
node scripts/export-data.mjs private-export/source-query.json private-export/analysis-all
```

| File                   | Contents                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `participants.csv`     | One included session per row; condition, demographics, saved conformity and social-presence scores   |
| `rankings.csv`         | Initial, assistant, and final item ranks                                                             |
| `discussion.csv`       | Saved reason text and audio exposure information                                                     |
| `social-presence.csv`  | SP1–SP5 in long format, linked by `session_id`                                                       |
| `analysis-summary.csv` | Counts, means, sample standard deviations, minima, and maxima by condition and protocol              |
| `export-audit.json`    | Inclusion/exclusion decisions, reasons, counts, and fingerprints of the input and conversion scripts |

Open the CSVs in Excel, jamovi, SPSS, R, or another analysis program. CSVs are UTF-8
with a byte-order mark to help Excel display Chinese text. Missing numeric scores
remain blank; they are not replaced with zero. Summary SD uses the `n - 1`
denominator and is blank when fewer than two values exist. An empty sample has
empty CSVs and a zero included count in the audit.

`analysis-summary.csv` gives **descriptive statistics**, not significance tests or
causal conclusions. For a planned between-condition analysis, use `condition` as
the grouping variable and your prespecified outcome columns from `participants.csv`.
Determine the statistical test from your research analysis plan. The exporter does
not select a test or choose a favorable outcome after inspecting results.

The converter retains the original eligibility checks: only completed study-mode
records passing the existing ranking, questionnaire, and audio checks are included.
Preview, withdrawn, incomplete, and skipped-audio sessions are excluded automatically.
Different protocol versions, item counts, permutations, or scoring versions are
summarized separately. Existing scores are copied without retrospective rescoring.

The main saved outcome names are:

- `bci`: reduction in disagreement relative to the initial disagreement; may be negative.
- `positive_conformity_01`: the positive part of BCI, with negative values floored at zero.
- `alignment_01`: final similarity to the assistant, rather than change from the initial ranking.
- `social_presence_5`: the saved mean of all five social-presence responses.

See `PERMUTATION_AND_SCORING.md` for formulas. The four-item social-presence column
is a separate existing output; it does not replace the five-item study outcome.

## 4. Exclude completed researcher tests without deleting them

Identify each test's exact `session_id` in `participants.csv` or the source query,
using your test log and timestamps. Timestamps may be UTC; convert them to your
local timezone before matching. Do not identify tests solely from their condition
or outcome. Record an objective exclusion reason.

Create `private-export/exclusions.json` in a text editor:

```json
[
  {
    "session_id": "paste-the-first-exact-id",
    "reason": "Researcher technical test"
  },
  {
    "session_id": "paste-the-second-exact-id",
    "reason": "Researcher audio verification"
  }
]
```

Replace the example IDs; these are session IDs, not invitation or completion codes.
For no manual exclusions, use `[]`. A copyable template is provided at
`research/exclusions.example.json`.

```sh
node scripts/export-data.mjs private-export/source-query.json private-export/analysis-clean --exclude private-export/exclusions.json
```

The same sessions are removed from every output table and the descriptive summary.
The audit records each exclusion and its reason. Unknown or duplicate IDs and empty
reasons cause an error so a typo cannot silently change the sample. An ID already
excluded by an automatic rule remains recorded under that rule, with its manual
reason also retained.

The original snapshot, database, and earlier analysis folder remain intact. To
restore a record, remove it from the exclusion list and export to a **new** output
directory, such as `private-export/analysis-clean-v2`. Existing outputs are never
silently overwritten. Apply study exclusions consistently, independently of whether
an outcome supports your hypothesis.

## 5. Verify or update the tools

```sh
node scripts/test-data.mjs
```

This checks synthetic fixtures in an ignored `outputs` folder. It does not contact
the production site or alter real data. Keep the raw snapshot, exclusions, output
folder, and repository commit together as your private analysis record.

If you cloned with Git, run `git pull --ff-only` to get future tool updates. If you
downloaded a ZIP, download the newer ZIP into a separate folder and privately copy
your source snapshot and exclusion list there. For full website development, see
the main README; it requires the additional project dependencies.
