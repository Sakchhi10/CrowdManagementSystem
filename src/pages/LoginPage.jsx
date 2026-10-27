import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { EyeIcon, EyeOffIcon, Logo } from '../components/Icons';
import MaskedPasswordInput from '../components/MaskedPasswordInput';
import { useI18n } from '../i18n/I18nContext';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(location.state?.expired ? t('login.expired') : '');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t('login.required'));
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
          ? t('login.invalid')
          : status === 429
            ? t('login.tooMany')
            : errorMessage(err, t('login.failed'))
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <h1>
          {t('login.welcome1')}
          <br />
          {t('login.welcome2')}
        </h1>
      </div>
      <form className="login-card" onSubmit={onSubmit} noValidate>
        <div className="login-card-head">
          <Logo />
        </div>
        <div className="login-card-body">
          <label className="field">
            <span>
              {t('login.id')} <em>*</em>
            </span>
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.idPlaceholder')}
              aria-invalid={!!error}
              autoFocus
            />
          </label>
          <label className="field">
            <span>
              {t('login.password')} <em>*</em>
            </span>
            <div className="password-wrap">
              <MaskedPasswordInput
                visible={showPassword}
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                placeholder={t('login.password')}
                aria-invalid={!!error}
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t('login.hide') : t('login.show')}
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
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
