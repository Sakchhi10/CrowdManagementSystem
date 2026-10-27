import { useEffect } from 'react';
import { useLive } from '../live/LiveContext';
import { formatDateTime } from '../utils/time';
import { CloseIcon, PinIcon } from './Icons';

export function SeverityBadge({ severity }) {
  const s = ['high', 'medium', 'low'].includes(severity) ? severity : 'low';
  return <span className={`severity severity-${s}`}>{s[0].toUpperCase() + s.slice(1)}</span>;
}

export function alertTitle(a) {
  if (a.message) return a.message;
  const verb = a.action === 'exit' ? 'Exited' : a.action === 'entry' ? 'Entered' : a.action;
  return `${a.personName} ${verb}`;
}

export default function AlertsPanel({ open, onClose }) {
  const { alerts, timeZone } = useLive();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`scrim${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open} aria-label="Alerts">
        <div className="drawer-head">
          <h2>Alerts</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close alerts">
            <CloseIcon />
          </button>
        </div>
        <div className="drawer-body">
          {alerts.length === 0 && <p className="muted center">No alerts yet. New entry and exit events will appear here as they happen.</p>}
          {alerts.map((a, i) => (
            <article key={a.id} className={`alert-card${i === 0 ? ' latest' : ''}`}>
              <div className="alert-time">{formatDateTime(a.ts, timeZone)}</div>
              <div className="alert-title">{alertTitle(a)}</div>
              <div className="alert-foot">
                <span className="alert-zone">
                  <PinIcon width={14} height={14} /> {a.zone}
                </span>
                <SeverityBadge severity={a.severity} />
              </div>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}
