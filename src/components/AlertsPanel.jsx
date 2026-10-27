import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useLive } from '../live/LiveContext';
import { formatDateTime } from '../utils/time';
import { CloseIcon, PinIcon } from './Icons';

export function SeverityBadge({ severity }) {
  const { t } = useI18n();
  const s = ['high', 'medium', 'low'].includes(severity) ? severity : 'low';
  return <span className={`severity severity-${s}`}>{t(`severity.${s}`)}</span>;
}

export function alertTitle(a, t) {
  if (a.message) return a.message;
  const verb = a.action === 'exit' ? t('alerts.exited') : a.action === 'entry' ? t('alerts.entered') : a.action;
  return `${a.personName} ${verb}`;
}

export default function AlertsPanel({ open, onClose }) {
  const { alerts, timeZone } = useLive();
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`scrim${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open} aria-label={t('alerts.title')}>
        <div className="drawer-head">
          <h2>{t('alerts.title')}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t('alerts.close')}>
            <CloseIcon />
          </button>
        </div>
        <div className="drawer-body">
          {alerts.length === 0 && <p className="muted center">{t('alerts.empty')}</p>}
          {alerts.map((a, i) => (
            <article key={a.id} className={`alert-card${i === 0 ? ' latest' : ''}`}>
              <div className="alert-time">{formatDateTime(a.ts, timeZone)}</div>
              <div className="alert-title">{alertTitle(a, t)}</div>
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
