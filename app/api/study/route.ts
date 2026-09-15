import {
  json,
  findSession,
  view,
  failure,
  studyConfigured,
} from '@/lib/server-study';
import { STUDY } from '@/lib/study-config';

export async function GET(request: Request) {
  try {
    const row = await findSession(request);
    const requestedCondition = new URL(request.url).searchParams.get(
      'testCondition',
    );
    const testMode =
      requestedCondition === 'fluent' || requestedCondition === 'disfluent';
    const matchingSession =
      row &&
      row.mode === (testMode ? 'preview' : 'study') &&
      (!testMode || row.condition === requestedCondition);
    return json({
      open: studyConfigured(),
      researcher: STUDY.researcher,
      institution: STUDY.institution,
      contact: STUDY.contact,
      retention: STUDY.retentionDescription,
      ethics: STUDY.ethicsReference,
      session: matchingSession ? view(row) : null,
    });
  } catch (error) {
    return failure(error);
  }
}
