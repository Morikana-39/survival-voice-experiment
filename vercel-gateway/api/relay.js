const WORKER_ORIGIN = 'https://survival-voice-experiment.s691lhg56.workers.dev';
const ALLOWED_ROUTES = new Set(['study', 'session', 'action']);

export const config = { api: { bodyParser: false } };

export default async function relay(req, res) {
  const route = req.query.route;
  if (typeof route !== 'string' || !ALLOWED_ROUTES.has(route)) {
    res.status(404).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).end();
    return;
  }

  // The browser must call the Vercel origin. The relay then makes the
  // equivalent same-origin request to the existing study Worker.
  const browserOrigin = req.headers.origin;
  const gatewayOrigin = `https://${req.headers.host}`;
  if (browserOrigin && browserOrigin !== gatewayOrigin) {
    res.status(403).end();
    return;
  }

  const incoming = new URL(req.url, gatewayOrigin);
  const upstreamUrl = new URL(`/api/${route}`, WORKER_ORIGIN);
  incoming.searchParams.delete('route');
  upstreamUrl.search = incoming.searchParams.toString();
  const headers = new Headers();
  if (req.headers.cookie) headers.set('cookie', req.headers.cookie);
  if (req.headers['content-type']) {
    headers.set('content-type', req.headers['content-type']);
  }
  if (browserOrigin) headers.set('origin', WORKER_ORIGIN);

  let body;
  if (req.method === 'POST') {
    const chunks = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 120_000) {
        res.status(413).end();
        return;
      }
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });
    for (const name of ['content-type', 'cache-control', 'set-cookie']) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.status(upstream.status).end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ error: 'The study service is temporarily unavailable.' });
  }
}
