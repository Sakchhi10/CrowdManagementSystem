import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLive } from '../live/LiveContext';
import { dateKeyInZone } from '../utils/time';
import AlertsPanel from './AlertsPanel';
import Toasts from './Toasts';
import { BellIcon, EntriesIcon, HomeIcon, Logo, LogoutIcon, MenuIcon, PinIcon } from './Icons';

export default function AppLayout() {
  const { logout } = useAuth();
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

  return (
    <div className={`shell${collapsed ? ' collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          {!collapsed && <Logo />}
          <button type="button" className="icon-button light" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle menu">
            <MenuIcon />
          </button>
        </div>
        <nav className="nav">
          <NavLink to="/dashboard" className="nav-item" title="Overview">
            <HomeIcon />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/entries" className="nav-item" title="Crowd Entries">
            <EntriesIcon />
            <span>Crowd Entries</span>
          </NavLink>
        </nav>
        <button type="button" className="nav-item logout" onClick={logout} title="Logout">
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="brand-title">Crowd Solutions</span>
          <span className="divider" />
          <label className="site-select">
            <PinIcon width={16} height={16} />
            <select
              value={siteId || ''}
              onChange={(e) => setSiteId(e.target.value)}
              disabled={sitesState.loading || !sites.length}
              aria-label="Site"
            >
              {sitesState.loading && <option>Loading sites…</option>}
              {sitesState.error && <option>Sites unavailable</option>}
              {sites.map((s) => (
                <option key={s.siteId} value={s.siteId}>
                  {s.name || s.siteId}
                </option>
              ))}
            </select>
          </label>
          <div className="topbar-right">
            <span className={`conn conn-${connection}`} title={`Live updates: ${connection}`}>
              <span className="conn-dot" />
              {{ connected: 'Live', connecting: 'Connecting', demo: 'Demo data' }[connection] || 'Offline'}
            </span>
            <button type="button" className="icon-button bell" onClick={openAlerts} aria-label={`Alerts (${unread} new)`}>
              <BellIcon />
              {unread > 0 && <span className="badge-dot">{unread > 99 ? '99+' : unread}</span>}
            </button>
          </div>
        </header>

        <main className="content">
          {sitesState.error ? (
            <div className="card">
              <p className="muted">Could not load sites. Dashboard data needs a site to query.</p>
            </div>
          ) : (
            dateKey && siteId && <Outlet context={{ dateKey, setDateKey, today }} />
          )}
          {!sitesState.error && (!dateKey || !siteId) && <div className="page-loading">Loading…</div>}
        </main>
      </div>

      <AlertsPanel open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <Toasts />
    </div>
  );
}
