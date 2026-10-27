import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import { DEMO_TOKEN, startDemoFeed } from '../api/demo';
import { getSites } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';

// Shared state for everything under the app shell: the site list and selection, the Socket.IO
// connection, the alert feed, and the latest live occupancy count per site.

const LiveContext = createContext(null);
const MAX_ALERTS = 100;
const SITE_KEY = 'cms.siteId';

// Event names are not documented in Swagger, so events are classified by name with onAny:
// anything mentioning "alert" is an alert, anything mentioning "occupancy" is a live count.
function classify(eventName) {
  const n = eventName.toLowerCase();
  if (n.includes('alert')) return 'alert';
  if (n.includes('occupancy')) return 'occupancy';
  return null;
}

function firstNumber(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

function unwrap(payload) {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return { message: payload };
    }
  }
  return payload?.data && typeof payload.data === 'object' ? { ...payload, ...payload.data } : payload;
}

let alertSeq = 0;
function normalizeAlert(raw) {
  const p = unwrap(raw) || {};
  const ts = firstNumber(p, ['ts', 'timestamp', 'utc', 'eventUtc', 'time', 'entryUtc', 'exitUtc']);
  const action = (p.action || p.type || p.eventType || p.direction || '').toString().toLowerCase();
  return {
    id: `${Date.now()}-${alertSeq++}`,
    ts: ts ? (ts < 1e12 ? ts * 1000 : ts) : Date.now(),
    action: action.includes('exit') ? 'exit' : action.includes('entr') ? 'entry' : action || 'event',
    personName: p.personName || p.name || p.visitorName || p.personId || 'Visitor',
    zone: p.zoneName || p.zone || p.zoneId || '—',
    siteId: p.siteId || p.site || null,
    siteName: p.siteName || null,
    severity: (p.severity || p.securityLevel || 'low').toString().toLowerCase(),
    message: p.message || null,
  };
}

export function LiveProvider({ children }) {
  const { token } = useAuth();
  const [sites, setSites] = useState([]);
  const [sitesState, setSitesState] = useState({ loading: true, error: null });
  const [siteId, setSiteIdState] = useState(() => {
    try {
      return sessionStorage.getItem(SITE_KEY);
    } catch {
      return null;
    }
  });
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [liveBySite, setLiveBySite] = useState({});
  const [connection, setConnection] = useState('connecting');
  const listeners = useRef(new Set());

  const loadSites = useCallback(async () => {
    setSitesState({ loading: true, error: null });
    try {
      const list = await getSites();
      setSites(list);
      setSiteIdState((cur) => (cur && list.some((s) => s.siteId === cur) ? cur : list[0]?.siteId ?? null));
      setSitesState({ loading: false, error: null });
    } catch (err) {
      setSitesState({ loading: false, error: err });
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const setSiteId = useCallback((id) => {
    setSiteIdState(id);
    try {
      sessionStorage.setItem(SITE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const siteIdRef = useRef(siteId);
  siteIdRef.current = siteId;

  useEffect(() => {
    if (!token) return undefined;

    const handleEvent = (eventName, payload) => {
      const kind = classify(eventName);
      if (kind === 'alert') {
        const alert = normalizeAlert(payload);
        setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
        setUnread((n) => n + 1);
        listeners.current.forEach((fn) => fn(alert));
      } else if (kind === 'occupancy') {
        const p = unwrap(payload) || {};
        const count =
          typeof payload === 'number'
            ? payload
            : firstNumber(p, ['occupancy', 'liveOccupancy', 'count', 'current', 'currentOccupancy', 'value', 'total']);
        if (count === null) return;
        const key = p.siteId || p.site || '*';
        setLiveBySite((prev) => ({ ...prev, [key]: { count, ts: Date.now(), zone: p.zoneName || p.zoneId || null } }));
      }
    };

    if (token === DEMO_TOKEN) {
      setConnection('demo');
      return startDemoFeed(handleEvent, () => siteIdRef.current);
    }

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      extraHeaders: { Authorization: `Bearer ${token}` },
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => setConnection('connected'));
    socket.on('disconnect', () => setConnection('disconnected'));
    socket.on('connect_error', () => setConnection('error'));
    socket.onAny(handleEvent);

    return () => {
      socket.offAny();
      socket.disconnect();
    };
  }, [token]);

  // Lets components (the toast stack) react to each alert as it arrives.
  const subscribeAlerts = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const site = sites.find((s) => s.siteId === siteId) || null;
  // Site-scoped count if the server tags events with a site, otherwise the untagged stream.
  const live = liveBySite[siteId] || liveBySite['*'] || null;
  const siteAlerts = useMemo(
    () => alerts.filter((a) => !a.siteId || !siteId || a.siteId === siteId),
    [alerts, siteId]
  );

  const value = {
    sites,
    sitesState,
    reloadSites: loadSites,
    site,
    siteId,
    setSiteId,
    timeZone: site?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    alerts: siteAlerts,
    unread,
    markRead: () => setUnread(0),
    live,
    connection,
    subscribeAlerts,
  };

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLive() {
  return useContext(LiveContext);
}
