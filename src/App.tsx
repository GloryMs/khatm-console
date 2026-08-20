import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import { queryClient } from '@/api/queryClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppShell } from '@/components/ui/AppShell';
import { AttestedIssuePage } from '@/features/attestedIssuance/AttestedIssuePage';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { RequireScope } from '@/features/auth/RequireScope';
import { BulkIssuePage } from '@/features/bulkIssuance/BulkIssuePage';
import { ConsumeSimPage } from '@/features/consumeSim/ConsumeSimPage';
import { ConsumingPartiesPage } from '@/features/consumingParties/ConsumingPartiesPage';
import { CredentialsPage } from '@/features/credentials/CredentialsPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { IssuePage } from '@/features/issuance/IssuePage';
import { KeyManagementPage } from '@/features/keyManagement/KeyManagementPage';
import { OrgChildPage } from '@/features/org/OrgChildPage';
import { OrgPage } from '@/features/org/OrgPage';
import { RevokePage } from '@/features/revoke/RevokePage';
import { SchemaBuilderPage } from '@/features/schemaManagement/SchemaBuilderPage';
import { SchemaManagementPage } from '@/features/schemaManagement/SchemaManagementPage';
import { SchemaViewPage } from '@/features/schemaManagement/SchemaViewPage';
import { SchemasPage } from '@/features/schemas/SchemasPage';
import { SecuritySettingsPage } from '@/features/security/SecuritySettingsPage';
import { TenantDetailPage } from '@/features/tenants/TenantDetailPage';
import { TenantsPage } from '@/features/tenants/TenantsPage';
import { UsersPage } from '@/features/users/UsersPage';
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
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route element={<AppShell />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/issue"
                    element={
                      <RequireScope scope="issue">
                        <IssuePage />
                      </RequireScope>
                    }
                  />
                  <Route path="/issue/bulk" element={<BulkIssuePage />} />
                  <Route path="/issue/attested" element={<AttestedIssuePage />} />
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
                  <Route path="/consumers" element={<ConsumingPartiesPage />} />
                  <Route path="/consume-sim" element={<ConsumeSimPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/key-management" element={<KeyManagementPage />} />
                  <Route path="/security" element={<SecuritySettingsPage />} />
                  <Route path="/tenants" element={<TenantsPage />} />
                  <Route path="/tenants/:id" element={<TenantDetailPage />} />
                  <Route path="/org" element={<OrgPage />} />
                  <Route path="/org/children/:id" element={<OrgChildPage />} />
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
