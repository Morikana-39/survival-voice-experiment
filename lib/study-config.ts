// Production collection settings. Test-link sessions use the separate preview mode
// and are never eligible for analysis exports.
export const STUDY = {
  open: true,
  researcher: '',
  contact: '',
  institution: '',
  ethicsReference: '',
  retentionDescription: '',
  consentApproved: true,
  stimuliApproved: true,
  minorParticipationReady: true,
  maxStudySessions: 500,
  expectedMinutes: '约 15',
  voiceProvider: '',
};
export function collectionReady(config: typeof STUDY) {
  return (
    config.open &&
    config.consentApproved &&
    config.stimuliApproved &&
    config.minorParticipationReady
  );
}
