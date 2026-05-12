import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MONTHLY_MAX,
  TRIAL_MAX,
  useSubscriptionStore,
} from '@/stores/subscriptionStore';

beforeEach(() => {
  useSubscriptionStore.getState().resetAll();
});

describe('subscriptionStore.consumeOne (free)', () => {
  it('decrementa o trial de 0 → 1 → 2 → 3 mas não passa', () => {
    const { consumeOne } = useSubscriptionStore.getState();
    consumeOne();
    expect(useSubscriptionStore.getState().trialUsed).toBe(1);
    consumeOne();
    expect(useSubscriptionStore.getState().trialUsed).toBe(2);
    consumeOne();
    expect(useSubscriptionStore.getState().trialUsed).toBe(TRIAL_MAX);
    // Continuar consumindo não passa do máximo (gate vai bloquear)
    consumeOne();
    expect(useSubscriptionStore.getState().trialUsed).toBe(TRIAL_MAX);
  });

  it('mantém monthlyUsed em 0 durante consumo no trial', () => {
    useSubscriptionStore.getState().consumeOne();
    useSubscriptionStore.getState().consumeOne();
    expect(useSubscriptionStore.getState().monthlyUsed).toBe(0);
  });
});

describe('subscriptionStore.markPro / consumeOne (pro)', () => {
  it('markPro reseta monthlyUsed para 0 e seta entitlement', () => {
    useSubscriptionStore.getState().consumeOne(); // gasta 1 do trial
    useSubscriptionStore.getState().markPro('monthly', '2099-01-01T00:00:00Z');

    const s = useSubscriptionStore.getState();
    expect(s.entitlement).toBe('pro');
    expect(s.plan).toBe('monthly');
    expect(s.monthlyUsed).toBe(0);
    // trialUsed mantém — o usuário pode ter usado e depois assinado
    expect(s.trialUsed).toBe(1);
  });

  it('consumeOne em pro incrementa monthlyUsed e não toca em trialUsed', () => {
    useSubscriptionStore.getState().markPro('monthly', null);
    useSubscriptionStore.getState().consumeOne();
    useSubscriptionStore.getState().consumeOne();
    const s = useSubscriptionStore.getState();
    expect(s.monthlyUsed).toBe(2);
    expect(s.trialUsed).toBe(0);
  });
});

describe('subscriptionStore.resetMonthlyIfNeeded', () => {
  it('reseta monthlyUsed quando passa da data de reset', () => {
    useSubscriptionStore.getState().markPro('monthly', null);
    useSubscriptionStore.getState().consumeOne();
    useSubscriptionStore.getState().consumeOne();
    expect(useSubscriptionStore.getState().monthlyUsed).toBe(2);

    // Força reset retroativo
    useSubscriptionStore.setState({
      monthlyResetAt: new Date(Date.now() - 1000).toISOString(),
    });

    useSubscriptionStore.getState().resetMonthlyIfNeeded();
    expect(useSubscriptionStore.getState().monthlyUsed).toBe(0);
  });

  it('NÃO reseta se ainda não chegou a data', () => {
    useSubscriptionStore.getState().markPro('monthly', null);
    useSubscriptionStore.getState().consumeOne();
    const before = useSubscriptionStore.getState().monthlyResetAt;

    useSubscriptionStore.getState().resetMonthlyIfNeeded();
    const after = useSubscriptionStore.getState();
    expect(after.monthlyUsed).toBe(1);
    expect(after.monthlyResetAt).toBe(before);
  });
});

describe('subscriptionStore.markFree', () => {
  it('volta para free e zera plan/expiresAt mas mantém contadores', () => {
    useSubscriptionStore.getState().markPro('yearly', '2099-01-01T00:00:00Z');
    useSubscriptionStore.getState().consumeOne();

    useSubscriptionStore.getState().markFree();
    const s = useSubscriptionStore.getState();
    expect(s.entitlement).toBe('free');
    expect(s.plan).toBeNull();
    expect(s.expiresAt).toBeNull();
    // contadores ficam — não queremos dar mais trial pra quem cancelou
    expect(s.monthlyUsed).toBe(1);
  });
});

describe('subscriptionStore — limites', () => {
  it('TRIAL_MAX é 3 e MONTHLY_MAX é 30', () => {
    expect(TRIAL_MAX).toBe(3);
    expect(MONTHLY_MAX).toBe(30);
  });
});
