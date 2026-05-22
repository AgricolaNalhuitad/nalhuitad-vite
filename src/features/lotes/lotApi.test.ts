import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addDoc, arrayUnion, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import {
  subscribeLot,
  createLot,
  updateLot,
  advanceStage,
  registerHarvest,
  registerRaleo,
} from './lotApi';
import type { AdvanceStageInput, HarvestInput, NewLotInput, RaleoInput, UpdateLotInput } from './types';

const mockOnSnapshot = vi.mocked(onSnapshot);
const mockDoc = vi.mocked(doc);
const mockCollection = vi.mocked(collection);
const mockAddDoc = vi.mocked(addDoc);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockArrayUnion = vi.mocked(arrayUnion);

beforeEach(() => {
  mockDoc.mockReturnValue({} as ReturnType<typeof doc>);
  mockCollection.mockReturnValue({} as ReturnType<typeof collection>);
  mockArrayUnion.mockImplementation((...items) => items as unknown as ReturnType<typeof arrayUnion>);
});

// ── subscribeLot ──────────────────────────────────────────────────────────────

describe('subscribeLot', () => {
  it('invoca onData con el lote normalizado al recibir snapshot que existe', () => {
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      (onNext as Function)({
        exists: () => true,
        id: 'lot1',
        data: () => ({ name: 'Milena', stage: 'almacigo', quantity: 10, date: '2026-01-01' }),
      });
      return mockUnsubscribe;
    });

    const onData = vi.fn();
    subscribeLot('lot1', onData, vi.fn());

    expect(onData).toHaveBeenCalledOnce();
    const [lot] = onData.mock.calls[0];
    expect(lot.id).toBe('lot1');
    expect(lot.name).toBe('Milena');
    expect(lot.currentQuantity).toBe(1350); // 10 × 135
  });

  it('invoca onData con null cuando el doc no existe', () => {
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      (onNext as Function)({ exists: () => false, id: 'lot-gone', data: () => null });
      return vi.fn();
    });

    const onData = vi.fn();
    subscribeLot('lot-gone', onData, vi.fn());
    expect(onData).toHaveBeenCalledWith(null);
  });

  it('invoca onError cuando Firestore emite error', () => {
    const fakeError = new Error('permission-denied');
    mockOnSnapshot.mockImplementation((_ref, _onNext, onError) => {
      (onError as Function)(fakeError);
      return vi.fn();
    });

    const onError = vi.fn();
    subscribeLot('lot1', vi.fn(), onError);
    expect(onError).toHaveBeenCalledWith(fakeError);
  });

  it('retorna la función unsubscribe de onSnapshot', () => {
    const mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);
    const unsub = subscribeLot('lot1', vi.fn(), vi.fn());
    expect(unsub).toBe(mockUnsubscribe);
  });
});

// ── createLot ─────────────────────────────────────────────────────────────────

describe('createLot', () => {
  it('llama addDoc con los campos correctos y retorna el id nuevo', async () => {
    mockAddDoc.mockResolvedValue({ id: 'new-lot-123' } as ReturnType<typeof addDoc> extends Promise<infer T> ? T : never);

    const input: NewLotInput = {
      name: 'Fantasía Sur',
      variety: 'Fantasía',
      date: '2026-05-01',
      quantity: 15,
      location: { invernadero: 'B', tipo: 'piscina', identificador: 'P02' },
    };

    const id = await createLot(input);

    expect(mockAddDoc).toHaveBeenCalledOnce();
    const [, data] = mockAddDoc.mock.calls[0];
    expect((data as unknown as Record<string, unknown>).name).toBe('Fantasía Sur');
    expect((data as unknown as Record<string, unknown>).stage).toBe('almacigo');
    expect((data as unknown as Record<string, unknown>).quantity).toBe(15);
    expect(id).toBe('new-lot-123');
  });
});

// ── updateLot ─────────────────────────────────────────────────────────────────

describe('updateLot', () => {
  it('llama updateDoc con los campos del input', async () => {
    const input: UpdateLotInput = { name: 'Nombre Nuevo', variety: 'Milena' };
    await updateLot('lot1', input);
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect((data as unknown as Record<string, unknown>).name).toBe('Nombre Nuevo');
  });
});

// ── advanceStage ──────────────────────────────────────────────────────────────

describe('advanceStage', () => {
  it('llama updateDoc con el nuevo stage y agrega entrada a stageHistory', async () => {
    const input: AdvanceStageInput = {
      newStage: 'transplante',
      date: '2026-02-01',
      quantity: 2700,
    };
    await advanceStage('lot1', input);
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect((data as unknown as Record<string, unknown>).stage).toBe('transplante');
    expect((data as unknown as Record<string, unknown>).currentQuantity).toBe(2700);
  });
});

// ── registerHarvest ───────────────────────────────────────────────────────────

describe('registerHarvest', () => {
  it('llama updateDoc con stage cosecha y agrega entrada a stageHistory', async () => {
    const input: HarvestInput = { date: '2026-04-01', notes: 'Cosecha exitosa' };
    await registerHarvest('lot1', input);
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect((data as unknown as Record<string, unknown>).stage).toBe('cosecha');
  });
});

// ── registerRaleo ─────────────────────────────────────────────────────────────

describe('registerRaleo', () => {
  it('llama updateDoc con la entrada de raleo y decrementa currentQuantity', async () => {
    const input: RaleoInput = { cantidadRaleada: 300, fecha: '2026-03-01' };
    await registerRaleo('lot1', 2500, input);
    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const [, data] = mockUpdateDoc.mock.calls[0];
    expect((data as unknown as Record<string, unknown>).currentQuantity).toBe(2200); // 2500 - 300
  });
});
