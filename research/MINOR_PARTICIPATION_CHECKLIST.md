# Including participants aged 12 and above

Updated 2026-09-06. Minimum age: **12**. No study upper age limit. This means adults remain eligible; a teenage focus is not equivalent to an exclusively teenage sample. The numeric validator requires whole, representable ages, not a capped adult age range.

## Current implementation

- Shared age validation is used by the age field and the session-creation endpoint. Under-12, fractional, nonnumeric and invalid numeric values are rejected.
- The previous statement that participants must be 18 or older is removed.
- The researcher preview requests fictional details and warns against submitting minors' real information. Preview answers still reach the database: exclusion from analysis does not exempt real information from privacy requirements.
- Real collection remains disabled. `minorParticipationReady` is an additional false-by-default launch gate, not evidence that any individual guardian gave permission.
- Guardian verification, guardian permission records and age-appropriate assent are **not yet implemented**. A participant checking a box must not be described as verified parental permission.
- The age-only revision originally left audio, historical responses and hosting access unchanged. The researcher subsequently requested publication of the 12-item/audio update on 2026-09-07, including the age change. Historical responses remain preserved; real collection stays closed.

## Before any recruitment of minors

1. Have the institution's ethics committee review the age range, the assent/consent process, any required guardian permission, the withholding of the speech-fluency manipulation and the debrief. Do not assume a consent waiver or exemption.
2. Prepare clear youth-facing assent and guardian information materials, explaining voluntariness, withdrawal, typed responses, timing/audio telemetry, storage and contacts. Avoid collecting unnecessary identity documents in the experiment.
3. Decide how guardian permission will be obtained and verified before the child's data are collected, and how completion of that process will be linked to an individually issued participation code. An approved offline recruitment process may be appropriate, but it has not been implemented or assumed here.
4. For mainland China, the Personal Information Protection Law treats personal information of children under 14 as sensitive and requires parent/guardian consent and special processing rules. This affects the proposed 12–13-year-old participants. See Articles 28–31 in the [official English law text hosted by the Supreme People's Procuratorate](https://en.spp.gov.cn/2021-12/29/c_948419_2.htm). Have the institution determine all applicable obligations, including those for ages 14–17.
5. Verify the hosting/data location, permitted access, retention/deletion schedule, handling of consent records and any cross-border requirements with the institution. This checklist is not a legal compliance determination.
6. Pilot the language, task length and potentially sensitive items (including the loaded pistol) with the intended age range under the approved process. Vodka is excluded from the selected 12-item subset. The current item list and scale wording have not been validated for adolescents.
7. Only after these steps, implement and test the actual permission workflow, approve the stimuli/consent documents, and consider opening collection. Do not turn a readiness flag on as a substitute for these steps.

For now, researcher testing with fictional ages can establish that age 12 proceeds and age 11 does not; it cannot validate a guardian-permission process that does not yet exist.
