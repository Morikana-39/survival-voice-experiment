import { bodyOf, createSession, failure } from '@/lib/server-study';
export async function POST(request: Request) {
  try {
    return await createSession(request, await bodyOf(request));
  } catch (e) {
    return failure(e);
  }
}
