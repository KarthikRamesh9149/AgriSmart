import { afterEach, describe, expect, it, vi } from 'vitest';

async function appWith(env: Record<string, string>) {
  vi.resetModules();
  Object.assign(process.env, {
    NODE_ENV: 'test', AUTH_MODE: 'token', AUTH_TOKENS_JSON: '{"alpha":{"actorId":"alice","tenantId":"farm-a"},"beta":{"actorId":"bob","tenantId":"farm-b"}}',
    AI_MODE: 'disabled', ...env,
  });
  const { buildApp } = await import('../../../../app.js');
  return buildApp();
}

describe('AI route security boundary', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requires authentication and returns a generic error', async () => {
    const app = await appWith({});
    const response = await app.inject({ method: 'POST', url: '/api/llm/feature1-narrative', payload: { district_id: 'mandya_ka' } });
    expect(response.statusCode).toBe(401);
    expect(response.json().error).toMatchObject({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    await app.close();
  });

  it('AI_MODE disabled guarantees no provider call even when a key exists', async () => {
    const fetchSpy = vi.fn(() => { throw new Error('network must not be called'); });
    vi.stubGlobal('fetch', fetchSpy);
    const app = await appWith({ MISTRAL_FEATURE1_KEY: 'configured-but-disabled' });
    const response = await app.inject({ method: 'POST', url: '/api/llm/feature1-narrative', headers: { authorization: 'Bearer alpha' }, payload: { district_id: 'mandya_ka' } });
    expect(response.statusCode).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    await app.close();
  });

  it('rejects oversized policy inputs and missing idempotency keys', async () => {
    const app = await appWith({});
    const headers = { authorization: 'Bearer alpha' };
    const oversized = await app.inject({ method: 'POST', url: '/api/llm/policy-freeform', headers: { ...headers, 'idempotency-key': 'abcdefgh' }, payload: { csv_text: 'x'.repeat(20_001), headers: ['ok'] } });
    expect(oversized.statusCode).toBe(400);
    expect(oversized.json()).not.toHaveProperty('error.details');
    const missingKey = await app.inject({ method: 'POST', url: '/api/llm/policy-freeform', headers, payload: { csv_text: 'a,b' } });
    expect(missingKey.statusCode).toBe(400);
    await app.close();
  });

  it('scopes idempotency replay to the authenticated actor and tenant', async () => {
    const app = await appWith({});
    const call = (token: string) => app.inject({ method: 'POST', url: '/api/llm/policy-freeform', headers: { authorization: `Bearer ${token}`, 'idempotency-key': 'same-key' }, payload: { csv_text: 'a,b', row_count: 1 } });
    const first = await call('alpha');
    const replay = await call('alpha');
    const other = await call('beta');
    expect(replay.body).toBe(first.body);
    expect(other.body).not.toBe(first.body);
    await app.close();
  });

  it('keeps deterministic snapshot available while AI is disabled', async () => {
    const app = await appWith({ MISTRAL_FEATURE4_KEY: 'configured-but-disabled' });
    const response = await app.inject({ method: 'POST', url: '/api/llm/feature4-time-travel', headers: { authorization: 'Bearer alpha' }, payload: { district_id: 'mandya_ka', time_horizon: 2050, current_year: 2026 } });
    expect(response.statusCode).toBe(200);
    expect(response.json().snapshot.label).toBe('Projection (2050)');
    await app.close();
  });

  it('enforces per-actor provider reservations', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: 'bounded response' } }],
      usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
    }), { status: 200, headers: { 'content-type': 'application/json' } })));
    const app = await appWith({ AI_MODE: 'mistral', MISTRAL_FEATURE1_KEY: 'test-key', AI_ACTOR_REQUEST_LIMIT: '1' });
    const call = () => app.inject({ method: 'POST', url: '/api/llm/feature1-narrative', headers: { authorization: 'Bearer alpha' }, payload: { district_id: 'mandya_ka' } });
    expect((await call()).statusCode).toBe(200);
    expect((await call()).statusCode).toBe(429);
    await app.close();
  });
});
