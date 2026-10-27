import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../api/endpoints';
import { setUnauthorizedHandler } from '../api/client';
import { clearToken, getToken, setToken } from './tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const navigate = useNavigate();

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      navigate('/login', { replace: true, state: { expired: true } });
    });
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    const newToken = await loginRequest(email, password);
    setToken(newToken);
    setTokenState(newToken);
  }, []);

  const value = useMemo(() => ({ token, isAuthenticated: !!token, login, logout }), [token, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
