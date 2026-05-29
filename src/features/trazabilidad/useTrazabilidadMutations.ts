import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSiembra } from './lotesOrigenApi';
import { registrarCosecha, trasladarUnidad } from './unidadesApi';
import { ralear } from './raleoApi';
import { LOTES_ORIGEN_QUERY_KEY } from './useLotesOrigen';
import { UNIDADES_QUERY_KEY } from './useUnidades';
import { unidadQueryKey } from './useUnidad';
import type { CosechaInput, NuevaSiembraInput, RaleoInput, TrasladoInput } from './types';

export function useCrearSiembra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaSiembraInput) => createSiembra(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_ORIGEN_QUERY_KEY });
    },
  });
}

export function useTrasladar(upId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TrasladoInput) => trasladarUnidad(upId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: UNIDADES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: unidadQueryKey(upId) });
    },
  });
}

export function useRalear(upOrigenId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RaleoInput) => ralear(upOrigenId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: UNIDADES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: unidadQueryKey(upOrigenId) });
    },
  });
}

export function useCosechar(upId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CosechaInput) => registrarCosecha(upId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: UNIDADES_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: unidadQueryKey(upId) });
      void qc.invalidateQueries({ queryKey: LOTES_ORIGEN_QUERY_KEY }); // posible auto-cierre del LO
    },
  });
}
