import { afterEach, describe, expect, it, vi } from 'vitest';

const original = { ...process.env };

describe('configuration security', () => {
  afterEach(() => {
    process.env = { ...original };
    vi.resetModules();
  });

  it('accepts blank demo environment values with safe defaults', async () => {
    Object.assign(process.env, { PORT: '', NODE_ENV: '', LOG_LEVEL: '', AI_MODE: '', AUTH_MODE: '', AUTH_TOKENS_JSON: '' });
    const { config } = await import('../index.js');
    expect(config).toMatchObject({ port: 8787, nodeEnv: 'development', aiMode: 'disabled', auth: { mode: 'demo', tokensJson: '{}' } });
  });

  it('rejects demo authentication in production', async () => {
    Object.assign(process.env, { NODE_ENV: 'production', AUTH_MODE: 'demo' });
    await expect(import('../index.js')).rejects.toThrow('AUTH_MODE=token is required in production');
  });
});
