import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useLive } from '../live/LiveContext';
import { alertTitle, SeverityBadge } from './AlertsPanel';
import { PinIcon } from './Icons';

const TOAST_MS = 4000;
const MAX_TOASTS = 3;

// Short-lived pop-ups for incoming alerts; the full history stays in the alerts drawer.
export default function Toasts() {
  const { subscribeAlerts, siteId } = useLive();
  const { t } = useI18n();
  const [toasts, setToasts] = useState([]);
  const siteRef = useRef(siteId);
  siteRef.current = siteId;

  useEffect(
    () =>
      subscribeAlerts((alert) => {
        if (alert.siteId && siteRef.current && alert.siteId !== siteRef.current) return;
        setToasts((prev) => [alert, ...prev].slice(0, MAX_TOASTS));
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== alert.id)), TOAST_MS);
      }),
    [subscribeAlerts]
  );

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.severity}`}>
          <div className="toast-title">{alertTitle(toast, t)}</div>
          <div className="alert-foot">
            <span className="alert-zone">
              <PinIcon width={14} height={14} /> {toast.zone}
            </span>
            <SeverityBadge severity={toast.severity} />
          </div>
        </div>
      ))}
    </div>
  );
}
