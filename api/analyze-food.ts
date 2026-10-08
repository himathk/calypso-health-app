// Vercel Function (Node.js runtime). Set ANTHROPIC_API_KEY in the project settings.
import { handleAnalyzeFood } from '../server/analyzeFood';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body must be JSON.', code: 'bad_request' }, { status: 400 });
  }
  const result = await handleAnalyzeFood(body);
  return Response.json(result.body, { status: result.status });
}
