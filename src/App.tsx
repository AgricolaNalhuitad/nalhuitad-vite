import { RouterProvider } from 'react-router-dom';
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';
import { appRouter } from './router';

export function App() {
  useAuthBootstrap();
  return <RouterProvider router={appRouter} />;
}
