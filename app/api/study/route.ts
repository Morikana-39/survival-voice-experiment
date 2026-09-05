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
    return json({
      open: studyConfigured(),
      researcher: STUDY.researcher,
      institution: STUDY.institution,
      contact: STUDY.contact,
      retention: STUDY.retentionDescription,
      ethics: STUDY.ethicsReference,
      session: row ? view(row) : null,
    });
  } catch (error) {
    return failure(error);
  }
}
