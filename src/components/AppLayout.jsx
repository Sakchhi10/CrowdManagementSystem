import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LANGUAGES, useI18n } from '../i18n/I18nContext';
import { useLive } from '../live/LiveContext';
import { dateKeyInZone } from '../utils/time';
import AlertsPanel from './AlertsPanel';
import Toasts from './Toasts';
import { BellIcon, EntriesIcon, HomeIcon, Logo, LogoutIcon, MenuIcon, PinIcon } from './Icons';

export default function AppLayout() {
  const { logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const { sites, sitesState, siteId, setSiteId, timeZone, unread, markRead, connection } = useLive();
  const [collapsed, setCollapsed] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  // Selected day (YYYY-MM-DD in the site's timezone), shared by Overview and Crowd Entries.
  const [dateKey, setDateKey] = useState(null);

  const today = dateKeyInZone(Date.now(), timeZone);
  useEffect(() => {
    setDateKey((cur) => cur || today);
  }, [today]);

  const openAlerts = () => {
    setAlertsOpen(true);
    markRead();
  };

  const connLabel = t({ connected: 'conn.connected', connecting: 'conn.connecting', demo: 'conn.demo' }[connection] || 'conn.offline');

  return (
    <div className={`shell${collapsed ? ' collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          {!collapsed && <Logo />}
          <button type="button" className="icon-button light" onClick={() => setCollapsed((c) => !c)} aria-label={t('nav.toggle')}>
            <MenuIcon />
          </button>
        </div>
        <nav className="nav">
          <NavLink to="/dashboard" className="nav-item" title={t('nav.overview')}>
            <HomeIcon />
            <span>{t('nav.overview')}</span>
          </NavLink>
          <NavLink to="/entries" className="nav-item" title={t('nav.entries')}>
            <EntriesIcon />
            <span>{t('nav.entries')}</span>
          </NavLink>
        </nav>
        <button type="button" className="nav-item logout" onClick={logout} title={t('nav.logout')}>
          <LogoutIcon />
          <span>{t('nav.logout')}</span>
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="brand-title">{t('brand.title')}</span>
          <span className="divider" />
          <label className="site-select">
            <PinIcon width={16} height={16} />
            <select
              value={siteId || ''}
              onChange={(e) => setSiteId(e.target.value)}
              disabled={sitesState.loading || !sites.length}
              aria-label={t('site.label')}
            >
              {sitesState.loading && <option>{t('site.loading')}</option>}
              {sitesState.error && <option>{t('site.unavailable')}</option>}
              {sites.map((s) => (
                <option key={s.siteId} value={s.siteId}>
                  {s.name || s.siteId}
                </option>
              ))}
            </select>
          </label>
          <div className="topbar-right">
            <span className={`conn conn-${connection}`} title={t('conn.title', { state: connLabel })}>
              <span className="conn-dot" />
              {connLabel}
            </span>
            <div className="lang-toggle" role="group" aria-label={t('lang.switch')}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  className={l.code === lang ? 'active' : ''}
                  aria-pressed={l.code === lang}
                  title={l.name}
                  onClick={() => setLang(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button type="button" className="icon-button bell" onClick={openAlerts} aria-label={t('alerts.open', { count: unread })}>
              <BellIcon />
              {unread > 0 && <span className="badge-dot">{unread > 99 ? '99+' : unread}</span>}
            </button>
            <img className="profile-avatar" src="/avatar.jpg" alt={t('profile')} width={40} height={40} />
          </div>
        </header>

        <main className="content">
          {sitesState.error ? (
            <div className="card">
              <p className="muted">{t('site.error')}</p>
            </div>
          ) : (
            dateKey && siteId && <Outlet context={{ dateKey, setDateKey, today }} />
          )}
          {!sitesState.error && (!dateKey || !siteId) && <div className="page-loading">{t('loading')}</div>}
        </main>
      </div>

      <AlertsPanel open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <Toasts />
    </div>
  );
}
