import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { RequireAuth } from './RequireAuth';

const baseAuth: AuthContextValue = {
  status: 'authenticated',
  user: null,
  login: async () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
  hasScope: () => false,
};

function renderAt(path: string, auth: AuthContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>login screen</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/change-password" element={<div>change-password screen</div>} />
            <Route path="/" element={<div>root screen</div>} />
            <Route path="/dashboard" element={<div>dashboard screen</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('RequireAuth', () => {
  it('redirects to /login when unauthenticated', () => {
    renderAt('/dashboard', { ...baseAuth, status: 'unauthenticated' });
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it('redirects to /change-password when mustChangePassword is set (spec FS-2.2 D5)', () => {
    renderAt('/dashboard', {
      ...baseAuth,
      user: { username: 'op1', scopes: [], mustChangePassword: true },
    });
    expect(screen.getByText('change-password screen')).toBeInTheDocument();
  });

  it('stays on /change-password while mustChangePassword is set', () => {
    renderAt('/change-password', {
      ...baseAuth,
      user: { username: 'op1', scopes: [], mustChangePassword: true },
    });
    expect(screen.getByText('change-password screen')).toBeInTheDocument();
  });

  it('redirects away from /change-password once mustChangePassword clears', () => {
    renderAt('/change-password', {
      ...baseAuth,
      user: { username: 'op1', scopes: [], mustChangePassword: false },
    });
    expect(screen.getByText('root screen')).toBeInTheDocument();
  });

  it('renders the normal route when authenticated and mustChangePassword is not set', () => {
    renderAt('/dashboard', {
      ...baseAuth,
      user: { username: 'op1', scopes: [], mustChangePassword: false },
    });
    expect(screen.getByText('dashboard screen')).toBeInTheDocument();
  });
});
