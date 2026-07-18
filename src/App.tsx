import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { queryClient } from '@/api/queryClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppShell } from '@/components/ui/AppShell';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { SchemasPage } from '@/features/schemas/SchemasPage';

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Navigate to="/schemas" replace />} />
                  <Route path="/schemas" element={<SchemasPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
