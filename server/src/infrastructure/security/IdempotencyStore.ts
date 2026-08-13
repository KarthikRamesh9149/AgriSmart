import type { ActorContext } from './ActorContext.js';

export class IdempotencyStore {
  private readonly values = new Map<string, { value: unknown; expiresAt: number }>();
  constructor(
    private readonly ttlMs = 24 * 60 * 60 * 1000,
    private readonly maxEntries = 10_000,
    private readonly now: () => number = Date.now
  ) {}
  private composite(actor: ActorContext, route: string, key: string): string {
    return [actor.tenantId, actor.actorId, route, key].join('\u0000');
  }
  get(actor: ActorContext, route: string, key: string): unknown {
    const composite = this.composite(actor, route, key);
    const entry = this.values.get(composite);
    if (!entry || entry.expiresAt <= this.now()) {
      this.values.delete(composite);
      return undefined;
    }
    return entry.value;
  }
  set(actor: ActorContext, route: string, key: string, value: unknown): void {
    const time = this.now();
    for (const [storedKey, entry] of this.values) if (entry.expiresAt <= time) this.values.delete(storedKey);
    const composite = this.composite(actor, route, key);
    if (!this.values.has(composite) && this.values.size >= this.maxEntries) {
      const oldest = this.values.keys().next().value as string | undefined;
      if (oldest) this.values.delete(oldest);
    }
    this.values.set(composite, { value, expiresAt: time + this.ttlMs });
  }
}
