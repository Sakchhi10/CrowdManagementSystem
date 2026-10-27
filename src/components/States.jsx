import { useI18n } from '../i18n/I18nContext';

// Shared loading / error / empty states used by every card, chart and table.

export function Skeleton({ width = '100%', height = 16, style }) {
  return <span className="skeleton" style={{ width, height, ...style }} aria-hidden />;
}

export function ErrorState({ message, onRetry, compact = false }) {
  const { t } = useI18n();
  return (
    <div className={`error-state${compact ? ' compact' : ''}`} role="alert">
      <span>{message || t('state.error')}</span>
      {onRetry && (
        <button type="button" className="link-button" onClick={onRetry}>
          {t('state.retry')}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }) {
  const { t } = useI18n();
  return <div className="empty-state">{children ?? t('state.empty')}</div>;
}

export function Spinner({ label }) {
  const { t } = useI18n();
  return <span className="spinner" role="status" aria-label={label ?? t('loading')} />;
}
