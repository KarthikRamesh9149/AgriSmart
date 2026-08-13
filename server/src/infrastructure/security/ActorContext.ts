import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Config } from '../../config/index.js';
import { parseAuthTokens } from '../../config/index.js';
import { AppError } from '../../domain/errors/AppError.js';
import { createHash, timingSafeEqual } from 'node:crypto';

export interface ActorContext { actorId: string; tenantId: string }

declare module 'fastify' {
  interface FastifyRequest { actor: ActorContext | null }
}

export async function registerActorContext(app: FastifyInstance, config: Config): Promise<void> {
  const tokens = Object.entries(parseAuthTokens(config.auth.tokensJson)).map(([token, actor]) => ({ digest: digest(token), actor }));
  app.decorateRequest('actor', null);
  app.addHook('onRequest', async (request) => {
    request.actor = authenticate(request, config, tokens);
  });
}

function authenticate(
  request: FastifyRequest,
  config: Config,
  tokens: Array<{ digest: Buffer; actor: ActorContext }>
): ActorContext | null {
  const match = /^Bearer ([^\s]+)$/.exec(request.headers.authorization ?? '');
  if (match) {
    const suppliedDigest = digest(match[1]);
    let matched: ActorContext | null = null;
    for (const entry of tokens) {
      if (timingSafeEqual(entry.digest, suppliedDigest)) matched = entry.actor;
    }
    if (matched) return { ...matched };
    if (config.auth.mode === 'demo' && config.auth.demoToken && timingSafeEqual(digest(config.auth.demoToken), suppliedDigest)) {
      return { actorId: 'demo-actor', tenantId: 'demo-tenant' };
    }
  }
  if (config.auth.mode === 'demo' && !config.auth.demoToken) {
    return { actorId: 'demo-actor', tenantId: 'demo-tenant' };
  }
  return null;
}

function digest(token: string): Buffer {
  return createHash('sha256').update(token, 'utf8').digest();
}

export function requireActor(request: FastifyRequest): ActorContext {
  if (!request.actor) throw AppError.unauthorized('Authentication required');
  return request.actor;
}
