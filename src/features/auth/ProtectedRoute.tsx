import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore } from './useSessionStore';
import { SplashScreen } from '@/shared/components/SplashScreen';

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const status = useSessionStore((s) => s.status);

  if (status === 'initializing') return <SplashScreen />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
