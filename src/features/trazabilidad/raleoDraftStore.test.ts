import { describe, it, expect, beforeEach } from 'vitest';
import { useRaleoDraftStore } from './raleoDraftStore';

beforeEach(() => {
  useRaleoDraftStore.setState({ drafts: {} });
});

describe('raleoDraftStore', () => {
  it('guarda un borrador por upId y lo recupera', () => {
    const draft = {
      destinos: [{ ubicacionId: 'INV-A-P01', cantidad: 270 }],
      fecha: '2026-06-01',
      notas: '',
    };
    useRaleoDraftStore.getState().setDraft('up-1', draft);
    expect(useRaleoDraftStore.getState().drafts['up-1']).toEqual(draft);
  });

  it('limpia el borrador de un upId sin tocar los demás', () => {
    const a = { destinos: [], fecha: '2026-06-01', notas: 'a' };
    const b = { destinos: [], fecha: '2026-06-02', notas: 'b' };
    useRaleoDraftStore.getState().setDraft('up-1', a);
    useRaleoDraftStore.getState().setDraft('up-2', b);

    useRaleoDraftStore.getState().clearDraft('up-1');

    expect(useRaleoDraftStore.getState().drafts['up-1']).toBeUndefined();
    expect(useRaleoDraftStore.getState().drafts['up-2']).toEqual(b);
  });
});
