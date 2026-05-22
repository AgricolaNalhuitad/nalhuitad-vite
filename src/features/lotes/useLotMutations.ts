import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  advanceStage,
  createLot,
  registerHarvest,
  registerRaleo,
  updateLot,
} from './lotApi';
import { LOTES_QUERY_KEY } from './useLotes';
import { lotQueryKey } from './useLot';
import type { AdvanceStageInput, HarvestInput, NewLotInput, RaleoInput, UpdateLotInput } from './types';

export function useCreateLot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewLotInput) => createLot(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
    },
  });
}

export function useUpdateLot(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLotInput) => updateLot(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
    },
  });
}

export function useAdvanceStage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdvanceStageInput) => advanceStage(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
    },
  });
}

export function useRegisterHarvest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: HarvestInput) => registerHarvest(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
    },
  });
}

export function useRegisterRaleo(id: string, currentQuantity: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RaleoInput) => registerRaleo(id, currentQuantity, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: lotQueryKey(id) });
    },
  });
}
