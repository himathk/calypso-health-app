import { buildFoodRequest, coerceFoodAnalysis, parseFoodResponse, type FoodAnalysis, type FoodAnalysisRequest } from './shared';

export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI food scanning is not set up yet.');
    this.name = 'AiNotConfiguredError';
  }
}

export type AiMode = 'server' | 'own-key' | 'none';

let serverAvailable: boolean | null = null;

/**
 * Photo → nutrition estimate.
 * 1. Uses the app's own /api/analyze-food endpoint when it's deployed with a key.
 * 2. Otherwise falls back to the user's personal Anthropic key, called directly from the browser.
 */
export async function analyzeFood(req: FoodAnalysisRequest, ownApiKey: string | undefined, signal?: AbortSignal): Promise<{ result: FoodAnalysis; mode: AiMode }> {
  if (serverAvailable !== false) {
    let res: Response | null = null;
    try {
      res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal,
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      res = null; // offline or static hosting without functions
    }
    const isJson = !!res?.headers.get('content-type')?.includes('json');
    if (res?.ok && isJson) {
      serverAvailable = true;
      return { result: coerceFoodAnalysis(await res.json()), mode: 'server' };
    }
    const unavailable = !res || !isJson || [404, 405, 501].includes(res.status);
    if (!unavailable && res) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Scan failed (${res.status}).`);
    }
    serverAvailable = false;
  }

  const key = ownApiKey?.trim();
  if (!key) throw new AiNotConfiguredError();

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  // The key never leaves this device except to api.anthropic.com.
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  try {
    const message = await client.beta.messages.create(buildFoodRequest(req), { signal });
    return { result: parseFoodResponse(message), mode: 'own-key' };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new Error('Your Anthropic API key was rejected. Check it in Settings.');
    if (error instanceof Anthropic.RateLimitError) throw new Error('Rate limited by the AI service — try again in a minute.');
    if (error instanceof Anthropic.APIConnectionError) throw new Error('Could not reach the AI service. Are you online?');
    throw error;
  }
}

/** Lets the settings screen show which AI path is active. */
export async function detectAiMode(ownApiKey: string | undefined): Promise<AiMode> {
  try {
    const res = await fetch('/api/analyze-food', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    // 400 = endpoint exists and has a key (it rejected our empty body).
    if (res.status === 400 && res.headers.get('content-type')?.includes('json')) {
      serverAvailable = true;
      return 'server';
    }
  } catch {
    /* fall through */
  }
  return ownApiKey?.trim() ? 'own-key' : 'none';
}
