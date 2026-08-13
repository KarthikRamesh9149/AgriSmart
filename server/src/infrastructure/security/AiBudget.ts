import type { ActorContext } from './ActorContext.js';
import { AppError } from '../../domain/errors/AppError.js';

export interface AiLimits {
  actorRequests: number; tenantRequests: number; actorCostUsd: number; tenantCostUsd: number;
}

interface Usage { requests: number; costUsd: number; expiresAt: number }

export class AiBudget {
  private readonly actors = new Map<string, Usage>();
  private readonly tenants = new Map<string, Usage>();
  constructor(
    private readonly limits: AiLimits,
    private readonly windowMs = 60 * 60 * 1000,
    private readonly maxIdentities = 10_000,
    private readonly now: () => number = Date.now
  ) {}

  reserve(actor: ActorContext, estimatedCostUsd: number): void {
    const actorKey = `${actor.tenantId}\u0000${actor.actorId}`;
    const time = this.now();
    this.prune(time);
    const actorUsage = this.current(this.actors.get(actorKey), time);
    const tenantUsage = this.current(this.tenants.get(actor.tenantId), time);
    if (actorUsage.requests + 1 > this.limits.actorRequests || actorUsage.costUsd + estimatedCostUsd > this.limits.actorCostUsd) {
      throw new AppError('AI_QUOTA_EXCEEDED', 'AI request budget exceeded', 429);
    }
    if (tenantUsage.requests + 1 > this.limits.tenantRequests || tenantUsage.costUsd + estimatedCostUsd > this.limits.tenantCostUsd) {
      throw new AppError('AI_QUOTA_EXCEEDED', 'AI request budget exceeded', 429);
    }
    if (!this.actors.has(actorKey) && this.actors.size >= this.maxIdentities) throw new AppError('AI_CAPACITY_EXCEEDED', 'AI request capacity exceeded', 503);
    if (!this.tenants.has(actor.tenantId) && this.tenants.size >= this.maxIdentities) throw new AppError('AI_CAPACITY_EXCEEDED', 'AI request capacity exceeded', 503);
    const expiresAt = Math.max(actorUsage.expiresAt, tenantUsage.expiresAt);
    this.actors.set(actorKey, { requests: actorUsage.requests + 1, costUsd: actorUsage.costUsd + estimatedCostUsd, expiresAt });
    this.tenants.set(actor.tenantId, { requests: tenantUsage.requests + 1, costUsd: tenantUsage.costUsd + estimatedCostUsd, expiresAt });
  }

  private current(usage: Usage | undefined, time: number): Usage {
    return usage && usage.expiresAt > time ? usage : { requests: 0, costUsd: 0, expiresAt: time + this.windowMs };
  }

  private prune(time: number): void {
    for (const [key, usage] of this.actors) if (usage.expiresAt <= time) this.actors.delete(key);
    for (const [key, usage] of this.tenants) if (usage.expiresAt <= time) this.tenants.delete(key);
  }
}
