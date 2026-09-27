# Vercel access gateway

This is a Vercel front door for the existing Cloudflare Worker deployment. It
does not migrate the application runtime or database. The current built CSS,
JavaScript, images and audio are copied into this folder and served directly by
Vercel. Vercel still obtains dynamic page HTML from the Worker, while the
serverless API relay forwards study requests to the Worker and preserves the
participant's session cookie. Responses remain in the existing D1 database.

Run `npm run build:vercel-gateway` from the project root before deploying this
folder. The copy step intentionally retains older content-hashed assets so that
an already-open or cached page continues to work after a deployment.

Upload this folder to Vercel Drop or deploy it with the Vercel CLI. The Worker
must remain deployed. Do not call this a standalone Vercel migration, and do
not recruit participants until the gateway URL has passed an end-to-end pilot
from the target network and devices.
