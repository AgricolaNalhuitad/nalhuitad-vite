import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RaleoDestino } from './types';

export interface RaleoDraft {
  destinos: RaleoDestino[];
  fecha: string;
  notas: string;
}

interface RaleoDraftState {
  drafts: Record<string, RaleoDraft>;
  setDraft: (upId: string, draft: RaleoDraft) => void;
  clearDraft: (upId: string) => void;
}

/**
 * Borrador local de raleo persistido en localStorage (FR-014). Permite reanudar un raleo
 * a medio capturar tras perder conexión o cerrar la pantalla; se limpia al confirmarse.
 */
export const useRaleoDraftStore = create<RaleoDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (upId, draft) =>
        set((state) => ({ drafts: { ...state.drafts, [upId]: draft } })),
      clearDraft: (upId) =>
        set((state) => {
          const next = { ...state.drafts };
          delete next[upId];
          return { drafts: next };
        }),
    }),
    { name: 'nalhuitad-raleo-draft' },
  ),
);
