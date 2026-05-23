import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as useLotModule from './useLot';
import { LotDetailScreen } from './LotDetailScreen';
import type { Lot } from './types';

vi.mock('./useLot');
vi.mock('./AdvanceStageSheet', () => ({ AdvanceStageSheet: () => null }));
vi.mock('./HarvestSheet', () => ({ HarvestSheet: () => null }));
vi.mock('./RaleoSheet', () => ({ RaleoSheet: () => null }));

const makeLot = (overrides: Partial<Lot>): Lot => ({
  id: 'lot1',
  name: 'Milena Norte',
  date: '2026-01-15',
  stage: 'almacigo',
  variety: 'Milena',
  quantity: 21,
  currentQuantity: 2700,
  location: { invernadero: 'A', tipo: 'piscina', identificador: 'P01' },
  stageHistory: [{ stage: 'almacigo', date: '2026-01-15' }],
  raleos: [],
  childrenIds: [],
  ...overrides,
});

const mockRetry = vi.fn();

function mockHook(overrides: Partial<ReturnType<typeof useLotModule.useLot>>) {
  vi.mocked(useLotModule.useLot).mockReturnValue({
    lot: undefined,
    isLoading: false,
    isError: false,
    error: null,
    retry: mockRetry,
    ...overrides,
  } as ReturnType<typeof useLotModule.useLot>);
}

function renderScreen(id = 'lot1') {
  return render(
    <MemoryRouter initialEntries={[`/lotes/${id}`]}>
      <Routes>
        <Route path="/lotes/:id" element={<LotDetailScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LotDetailScreen', () => {
  it('muestra skeleton cuando isLoading', () => {
    mockHook({ isLoading: true });
    renderScreen();
    expect(document.querySelector('[data-testid="detail-skeleton"]')).toBeInTheDocument();
  });

  it('muestra error state cuando isError', () => {
    mockHook({ isError: true });
    renderScreen();
    expect(screen.getByText('No pudimos cargar el lote')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('muestra "Lote no encontrado" cuando lot es null', () => {
    mockHook({ lot: null });
    renderScreen();
    expect(screen.getByText('Lote no encontrado')).toBeInTheDocument();
  });

  it('muestra el nombre y la etapa del lote', () => {
    mockHook({ lot: makeLot({}) });
    renderScreen();
    expect(screen.getByText('Milena Norte')).toBeInTheDocument();
    expect(screen.getByText('Almácigo')).toBeInTheDocument();
  });

  it('muestra stats de plantas', () => {
    mockHook({ lot: makeLot({}) });
    renderScreen();
    expect(screen.getByText('Sembradas')).toBeInTheDocument();
    expect(screen.getByText('En producción')).toBeInTheDocument();
  });

  it('lote raíz: Sembradas muestra bandejas × 135 (no quantity crudo)', () => {
    // quantity=21 bandejas → 21×135=2.835 plantas
    mockHook({ lot: makeLot({ quantity: 21 }) });
    renderScreen();
    expect(screen.getByText(/2\.835|2835/)).toBeInTheDocument();
  });

  it('lote hijo (parentId): Sembradas muestra quantity directamente sin multiplicar', () => {
    // quantity=385 ya son plantas — NO debe mostrar 385×135=51.975
    mockHook({ lot: makeLot({ quantity: 385, parentId: 'padre-1' }) });
    renderScreen();
    expect(screen.getByText(/385/)).toBeInTheDocument();
    expect(screen.queryByText(/51\.975|51975/)).not.toBeInTheDocument();
  });

  it('botón "Avanzar etapa" está habilitado en almacigo', () => {
    mockHook({ lot: makeLot({ stage: 'almacigo' }) });
    renderScreen();
    const btn = screen.getByRole('button', { name: /Avanzar etapa/ });
    expect(btn).not.toBeDisabled();
  });

  it('botón "Avanzar etapa" está deshabilitado en cosecha', () => {
    mockHook({ lot: makeLot({ stage: 'cosecha' }) });
    renderScreen();
    const btn = screen.getByRole('button', { name: /Avanzar etapa/ });
    expect(btn).toBeDisabled();
  });

  it('muestra historial de etapas', () => {
    const lot = makeLot({
      stageHistory: [
        { stage: 'almacigo', date: '2026-01-15' },
        { stage: 'transplante', date: '2026-02-01' },
      ],
    });
    mockHook({ lot });
    renderScreen();
    expect(screen.getByText('Historial de etapas')).toBeInTheDocument();
    expect(screen.getAllByText(/Almácigo|Transplante/).length).toBeGreaterThan(0);
  });
});
