import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { EyeIcon, EyeOffIcon, Logo } from '../components/Icons';
import MaskedPasswordInput from '../components/MaskedPasswordInput';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(location.state?.expired ? 'Your session has expired. Please log in again.' : '');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your login ID and password.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      setError(
        status === 401 || status === 400
          ? 'Invalid login ID or password.'
          : status === 429
            ? 'Too many attempts. Please wait a moment and try again.'
            : errorMessage(err, 'Unable to log in. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <h1>
          Welcome to the
          <br />
          Crowd Management System
        </h1>
      </div>
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <div className="login-card-head">
          <Logo />
        </div>
        <div className="login-card-body">
          <label className="field">
            <span>
              Log In <em>*</em>
            </span>
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or login ID"
              aria-invalid={!!error}
              autoFocus
            />
          </label>
          <label className="field">
            <span>
              Password <em>*</em>
            </span>
            <div className="password-wrap">
              <MaskedPasswordInput
                visible={showPassword}
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                placeholder="Password"
                aria-invalid={!!error}
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </div>
      </form>
    </div>
  );
}
