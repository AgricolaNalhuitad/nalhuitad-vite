import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collection, onSnapshot } from 'firebase/firestore';
import { normalizeLot, subscribeLotes } from './lotesApi';
import type { LotDoc } from './types';

const mockOnSnapshot = vi.mocked(onSnapshot);
const mockCollection = vi.mocked(collection);

beforeEach(() => {
  mockCollection.mockReturnValue({} as ReturnType<typeof collection>);
});

// ── normalizeLot ─────────────────────────────────────────────────────────────

describe('normalizeLot', () => {
  it('doc completo: todos los campos mapeados correctamente', () => {
    const doc: LotDoc = {
      id: 'lot1',
      name: 'Milena Norte',
      date: '2026-01-15',
      stage: 'raleo',
      variety: 'Milena',
      quantity: 21,
      currentQuantity: 2500,
      location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
      stageHistory: [{ stage: 'almacigo', date: '2026-01-15' }],
      raleos: [{ fecha: '2026-02-01', cantidadRaleada: 100 }],
      childrenIds: ['child1'],
    };
    const lot = normalizeLot(doc);
    expect(lot.id).toBe('lot1');
    expect(lot.name).toBe('Milena Norte');
    expect(lot.stage).toBe('raleo');
    expect(lot.currentQuantity).toBe(2500);
    expect(lot.location?.invernadero).toBe('A');
    expect(lot.childrenIds).toEqual(['child1']);
  });

  it('doc sin quantity: quantity=0, currentQuantity=0', () => {
    const doc: LotDoc = { id: 'lot2' };
    const lot = normalizeLot(doc);
    expect(lot.quantity).toBe(0);
    expect(lot.currentQuantity).toBe(0);
  });

  it('doc sin currentQuantity: se calcula toPlants(quantity)', () => {
    const doc: LotDoc = { id: 'lot3', quantity: 10 };
    const lot = normalizeLot(doc);
    expect(lot.currentQuantity).toBe(1350); // 10 × 135
  });

  it('doc sin stage: stage="almacigo"', () => {
    const doc: LotDoc = { id: 'lot4' };
    expect(normalizeLot(doc).stage).toBe('almacigo');
  });

  it('doc sin stageHistory: stageHistory=[]', () => {
    const doc: LotDoc = { id: 'lot5' };
    expect(normalizeLot(doc).stageHistory).toEqual([]);
  });

  it('doc sin location pero con locations[]: usa el primero', () => {
    const loc = { invernadero: 'B', tipo: 'tubo', identificador: 'T01' };
    const doc: LotDoc = { id: 'lot6', locations: [loc] };
    expect(normalizeLot(doc).location).toEqual(loc);
  });

  it('doc sin location ni locations: location=null', () => {
    const doc: LotDoc = { id: 'lot7' };
    expect(normalizeLot(doc).location).toBeNull();
  });
});

// ── subscribeLotes ────────────────────────────────────────────────────────────

describe('subscribeLotes', () => {
  it('invoca onData con lots normalizados al recibir snapshot', () => {
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      (onNext as Function)({
        docs: [
          {
            id: 'lot1',
            data: () => ({ name: 'Test', stage: 'almacigo', quantity: 5, date: '2026-01-01' }),
          },
        ],
      });
      return mockUnsubscribe;
    });

    const onData = vi.fn();
    subscribeLotes(onData, vi.fn());

    expect(onData).toHaveBeenCalledOnce();
    const [lots] = onData.mock.calls[0];
    expect(lots).toHaveLength(1);
    expect(lots[0].id).toBe('lot1');
    expect(lots[0].currentQuantity).toBe(675); // 5 × 135
  });

  it('invoca onError cuando Firestore emite error', () => {
    const fakeError = new Error('permission-denied');
    mockOnSnapshot.mockImplementation((_ref, _onNext, onError) => {
      (onError as Function)(fakeError);
      return vi.fn();
    });

    const onError = vi.fn();
    subscribeLotes(vi.fn(), onError);

    expect(onError).toHaveBeenCalledWith(fakeError);
  });

  it('retorna la función unsubscribe de onSnapshot', () => {
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);

    const unsub = subscribeLotes(vi.fn(), vi.fn());
    expect(unsub).toBe(mockUnsubscribe);
  });
});
