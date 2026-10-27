// Shared loading / error / empty states used by every card, chart and table.

export function Skeleton({ width = '100%', height = 16, style }) {
  return <span className="skeleton" style={{ width, height, ...style }} aria-hidden />;
}

export function ErrorState({ message, onRetry, compact = false }) {
  return (
    <div className={`error-state${compact ? ' compact' : ''}`} role="alert">
      <span>{message || 'Could not load data'}</span>
      {onRetry && (
        <button type="button" className="link-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children = 'No data for this period' }) {
  return <div className="empty-state">{children}</div>;
}

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner" role="status" aria-label={label} />;
}
