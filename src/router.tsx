import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicRoute } from '@/features/auth/PublicRoute';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { AppShell } from '@/shared/components/AppShell';
import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';
import { MasMenu } from '@/shared/components/MasMenu';
import { LotesScreen } from '@/features/lotes/LotesScreen';
import { LotDetailScreen } from '@/features/lotes/LotDetailScreen';
import { CreateLotScreen } from '@/features/lotes/CreateLotScreen';
import { EditLotScreen } from '@/features/lotes/EditLotScreen';
import {
  CrearSiembraScreen,
  TrazabilidadListScreen,
  QrPrintScreen,
  UpDetailScreen,
  TrasladarUpScreen,
  RalearUpScreen,
} from '@/features/trazabilidad';

// eslint-disable-next-line react-refresh/only-export-components
function MasSubScreen() {
  const { screen } = useParams<{ screen: string }>();
  const label = screen ? screen.charAt(0).toUpperCase() + screen.slice(1) : 'Más';
  return <PlaceholderScreen name={label} />;
}

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginScreen />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/lotes" replace /> },
      { path: 'lotes',            element: <LotesScreen /> },
      { path: 'lotes/nuevo',      element: <CreateLotScreen /> },
      { path: 'lotes/:id',        element: <LotDetailScreen /> },
      { path: 'lotes/:id/editar', element: <EditLotScreen /> },
      { path: 'trazabilidad',         element: <TrazabilidadListScreen /> },
      { path: 'trazabilidad/siembra', element: <CrearSiembraScreen /> },
      { path: 'dashboard',  element: <PlaceholderScreen name="Dashboard" /> },
      { path: 'alertas',    element: <PlaceholderScreen name="Alertas" /> },
      { path: 'produccion', element: <PlaceholderScreen name="Producción" /> },
      { path: 'mas',        element: <MasMenu /> },
      { path: 'mas/:screen', element: <MasSubScreen /> },
    ],
  },
  {
    path: '/up/:upId',
    element: (
      <ProtectedRoute>
        <UpDetailScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: '/up/:upId/trasladar',
    element: (
      <ProtectedRoute>
        <TrasladarUpScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: '/up/:upId/ralear',
    element: (
      <ProtectedRoute>
        <RalearUpScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: '/up/:upId/qr',
    element: (
      <ProtectedRoute>
        <QrPrintScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
