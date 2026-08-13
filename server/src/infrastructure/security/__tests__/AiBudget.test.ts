import { describe, expect, it } from 'vitest';
import { AiBudget } from '../AiBudget.js';

describe('AiBudget', () => {
  it('isolates actor usage while enforcing a shared tenant cap', () => {
    const budget = new AiBudget({ actorRequests: 2, tenantRequests: 2, actorCostUsd: 1, tenantCostUsd: 1 });
    budget.reserve({ actorId: 'a', tenantId: 't' }, 0.1);
    budget.reserve({ actorId: 'b', tenantId: 't' }, 0.1);
    expect(() => budget.reserve({ actorId: 'c', tenantId: 't' }, 0.1)).toThrow('AI request budget exceeded');
    expect(() => budget.reserve({ actorId: 'a', tenantId: 'other' }, 0.1)).not.toThrow();
  });

  it('resets fixed-window usage and caps identity storage', () => {
    let now = 0;
    const budget = new AiBudget({ actorRequests: 1, tenantRequests: 10, actorCostUsd: 1, tenantCostUsd: 10 }, 100, 1, () => now);
    budget.reserve({ actorId: 'a', tenantId: 't' }, 0.1);
    expect(() => budget.reserve({ actorId: 'b', tenantId: 'other' }, 0.1)).toThrow('capacity exceeded');
    now = 101;
    expect(() => budget.reserve({ actorId: 'b', tenantId: 'other' }, 0.1)).not.toThrow();
  });
});
