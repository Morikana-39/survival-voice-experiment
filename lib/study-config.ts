// Collection is deliberately closed while the researcher supplies the recordings and consent details.
// Preview is a separate mode: its responses are never eligible for analysis.
export const STUDY = {
  open: false,
  researcher: '',
  contact: '',
  institution: '',
  ethicsReference: '',
  retentionDescription: '',
  consentApproved: false,
  stimuliApproved: false,
  // Keep false until approved assent, guardian permission and child-data handling are implemented.
  // This is a launch checklist gate, NOT proof of permission for an individual participant.
  minorParticipationReady: false,
  maxStudySessions: 500,
  expectedMinutes: '20–30',
  voiceProvider: '',
};
export function collectionReady(config: typeof STUDY) {
  return (
    config.open &&
    config.consentApproved &&
    config.stimuliApproved &&
    config.minorParticipationReady &&
    !!config.researcher &&
    !!config.contact &&
    !!config.retentionDescription
  );
}
