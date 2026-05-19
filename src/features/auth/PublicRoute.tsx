import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore } from './useSessionStore';
import { SplashScreen } from '@/shared/components/SplashScreen';

interface Props {
  children: ReactNode;
}

export function PublicRoute({ children }: Props) {
  const status = useSessionStore((s) => s.status);

  if (status === 'initializing') return <SplashScreen />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <>{children}</>;
}
