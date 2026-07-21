import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { queryClient } from '@/api/queryClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppShell } from '@/components/ui/AppShell';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequireScope } from '@/features/auth/RequireScope';
import { CredentialsPage } from '@/features/credentials/CredentialsPage';
import { IssuePage } from '@/features/issuance/IssuePage';
import { RevokePage } from '@/features/revoke/RevokePage';
import { SchemaBuilderPage } from '@/features/schemaManagement/SchemaBuilderPage';
import { SchemaManagementPage } from '@/features/schemaManagement/SchemaManagementPage';
import { SchemaViewPage } from '@/features/schemaManagement/SchemaViewPage';
import { SchemasPage } from '@/features/schemas/SchemasPage';
import { VerifyPage } from '@/features/verify/VerifyPage';

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
                  <Route
                    path="/issue"
                    element={
                      <RequireScope scope="issue">
                        <IssuePage />
                      </RequireScope>
                    }
                  />
                  <Route path="/schemas" element={<SchemasPage />} />
                  <Route path="/schemas/manage" element={<SchemaManagementPage />} />
                  <Route path="/schemas/manage/new" element={<SchemaBuilderPage mode="create" />} />
                  <Route
                    path="/schemas/manage/:id/edit"
                    element={<SchemaBuilderPage mode="edit" />}
                  />
                  <Route
                    path="/schemas/manage/:id/version"
                    element={<SchemaBuilderPage mode="version" />}
                  />
                  <Route path="/schemas/manage/:id" element={<SchemaViewPage />} />
                  <Route path="/credentials" element={<CredentialsPage />} />
                  <Route path="/verify" element={<VerifyPage />} />
                  <Route path="/revoke" element={<RevokePage />} />
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
