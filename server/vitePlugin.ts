import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import { handleAnalyzeFood } from './analyzeFood.js';

const MAX_BODY = 10 * 1024 * 1024;

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

const middleware: Connect.NextHandleFunction = async (req, res, next) => {
  if (req.url?.split('?')[0] !== '/api/analyze-food') return next();
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.', code: 'method' });
  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: 'Body must be JSON under 10 MB.', code: 'bad_request' });
  }
  const result = await handleAnalyzeFood(body);
  send(res, result.status, result.body);
};

/** Serves /api/analyze-food from `vite dev` and `vite preview`, mirroring the Vercel function. */
export function calypsoApi(): Plugin {
  return {
    name: 'calypso-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
