import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicRoute } from '@/features/auth/PublicRoute';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { AppShell } from '@/shared/components/AppShell';
import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';
import { MasMenu } from '@/shared/components/MasMenu';

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
      { path: 'lotes', element: <PlaceholderScreen name="Lotes" /> },
      { path: 'dashboard', element: <PlaceholderScreen name="Dashboard" /> },
      { path: 'alertas', element: <PlaceholderScreen name="Alertas" /> },
      { path: 'produccion', element: <PlaceholderScreen name="Producción" /> },
      { path: 'mas', element: <MasMenu /> },
      { path: 'mas/:screen', element: <MasSubScreen /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
