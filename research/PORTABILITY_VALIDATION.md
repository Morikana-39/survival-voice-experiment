# Analysis portability verification — 2026-09-27

- The offline exporter and its synthetic data tests passed on Node.js 22.14.0.
- With no manual exclusions, all four original CSV outputs were compared against
  the previous committed exporter using the same synthetic input and were
  byte-for-byte identical.
- Tests cover manual removal from all four tables, recorded exclusion reasons,
  unknown/duplicate IDs, missing reasons, empty samples, preserved original inputs,
  overwrite protection, legacy metrics, and separate descriptive groups with
  missing values and sample standard deviations.
- The optional authenticated downloader is syntax-checked; no production database
  query was run as part of publishing this repository.
- The separate existing experiment protocol suite reports 10 passing tests and
  3 failures. Its stale expectations concern the launch readiness default,
  preview audio condition, and skipped preview audio. The protocol test file and
  its runtime imports were unchanged by this analysis update. These failures are
  not hidden or treated as proof that the full website passed validation.

The GitHub snapshot includes the previously existing website/gateway changes.
This task adds local analysis utilities and documentation; it does not deploy the
site, modify the research protocol, rescore stored results, or update the database.
