// Demo mode: logging in with the test credentials from VITE_DEMO_EMAIL / VITE_DEMO_PASSWORD
// skips the real API and serves generated sample data, so every screen can be explored
// without a real account. Demo mode is off when they are unset. Real credentials always go to the API.

export const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || '';
export const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || '';
export const DEMO_TOKEN = 'demo-session';

const HOUR = 60 * 60 * 1000;

export const DEMO_SITES = [
  {
    siteId: 'SITE-IN-BLR-001',
    name: 'Avenue Mall',
    timezone: 'Asia/Kolkata',
    country: 'India',
    city: 'Bengaluru',
    zones: [
      { zoneId: 'Z-A', name: 'Zone A', securityLevel: 'high' },
      { zoneId: 'Z-B', name: 'Zone B', securityLevel: 'medium' },
      { zoneId: 'Z-C', name: 'Food Court', securityLevel: 'low' },
    ],
  },
  {
    siteId: 'SITE-AE-DXB-001',
    name: 'Dubai Mall',
    timezone: 'Asia/Dubai',
    country: 'UAE',
    city: 'Dubai',
    zones: [
      { zoneId: 'Z-AE-DXB-001-H', name: 'Luxury Retail Wing', securityLevel: 'high' },
      { zoneId: 'Z-AE-DXB-001-M', name: 'Atrium', securityLevel: 'medium' },
      { zoneId: 'Z-AE-DXB-001-L', name: 'Parking Level 1', securityLevel: 'low' },
    ],
  },
];

const FIRST = ['Alice', 'Brian', 'Catherine', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Isabella', 'Jack', 'Katherine', 'Liam', 'Maya', 'Noah', 'Olivia', 'Priya', 'Rahul', 'Sara', 'Tom', 'Uma', 'Victor', 'Wen', 'Yusuf', 'Zara'];
const LAST = ['Johnson', 'Smith', 'Lee', 'Brown', 'White', 'Green', 'Taylor', 'Wilson', 'Martinez', 'Thompson', 'Anderson', 'Khan', 'Patel', 'Nair', 'Garcia', 'Chen'];
const FEMALE = new Set(['Alice', 'Catherine', 'Eva', 'Grace', 'Isabella', 'Katherine', 'Maya', 'Olivia', 'Priya', 'Sara', 'Uma', 'Wen', 'Zara']);

// Small deterministic PRNG so the same site/day always shows the same numbers.
function rng(seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) h = Math.imul(h ^ seedText.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const delay = (ms = 250 + Math.random() * 350) => new Promise((r) => setTimeout(r, ms));

function localHour(t, siteId) {
  const tz = (DEMO_SITES.find((s) => s.siteId === siteId) || DEMO_SITES[0]).timezone;
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(t));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return get('hour') + get('minute') / 60;
}

// Crowd curve over the site's local day: quiet overnight, peaking in the evening.
function crowdAt(t, siteId, rand, scale = 1) {
  const shape = Math.max(0, Math.sin(((localHour(t, siteId) - 6) / 18) * Math.PI));
  return Math.round(siteBase(siteId) * scale * (0.35 + 0.75 * shape) + (rand() - 0.5) * 12);
}

function hourlyBuckets(fromUtc, toUtc) {
  const out = [];
  // fromUtc is the site's local midnight, so stepping from it keeps buckets on local hours.
  for (let t = fromUtc; t <= toUtc; t += HOUR) out.push(t);
  return out;
}

const siteBase = (siteId) => (siteId === 'SITE-AE-DXB-001' ? 260 : 170);
const daySeed = (siteId, fromUtc) => `${siteId}:${Math.floor(fromUtc / (24 * HOUR))}`;

export async function demoSites() {
  await delay(150);
  return DEMO_SITES;
}

export async function demoOccupancy({ siteId, fromUtc, toUtc }) {
  await delay();
  const rand = rng(`occ:${daySeed(siteId, fromUtc)}`);
  const buckets = hourlyBuckets(fromUtc, toUtc).map((t) => ({ t, value: crowdAt(t, siteId, rand) }));
  return { buckets, live: buckets.at(-1)?.value ?? null };
}

export async function demoFootfall({ siteId, fromUtc, toUtc }) {
  await delay();
  const rand = rng(`ff:${daySeed(siteId, fromUtc)}`);
  const hours = Math.max(0, (toUtc - fromUtc) / HOUR);
  return { footfall: Math.round(hours * siteBase(siteId) * (0.75 + rand() * 0.5)) };
}

export async function demoDwell({ siteId, fromUtc }) {
  await delay();
  const rand = rng(`dw:${daySeed(siteId, fromUtc)}`);
  return { avgDwellMinutes: Math.round((7 + rand() * 4) * 100) / 100, dwellRecords: Math.round(400 + rand() * 300) };
}

export async function demoDemographics({ siteId, fromUtc, toUtc }) {
  await delay();
  const rand = rng(`demo:${daySeed(siteId, fromUtc)}`);
  const buckets = hourlyBuckets(fromUtc, toUtc).map((t) => {
    const total = crowdAt(t, siteId, rand, 1.8);
    const maleShare = 0.53 + (rand() - 0.5) * 0.06;
    return { t, male: Math.round(total * maleShare), female: Math.round(total * (1 - maleShare)) };
  });
  const totals = buckets.reduce((a, b) => ({ male: a.male + b.male, female: a.female + b.female }), { male: 0, female: 0 });
  return { buckets, totals };
}

function demoRecords(siteId, fromUtc, toUtc) {
  const rand = rng(`ee:${daySeed(siteId, fromUtc)}`);
  const site = DEMO_SITES.find((s) => s.siteId === siteId) || DEMO_SITES[0];
  const count = Math.round(((toUtc - fromUtc) / HOUR) * 9);
  const now = Date.now();
  const records = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const entryUtc = Math.round(fromUtc + rand() * (toUtc - fromUtc));
    const dwellMinutes = Math.round(5 + rand() * 55);
    const exitCandidate = entryUtc + dwellMinutes * 60000;
    const stillInside = exitCandidate > Math.min(toUtc, now) || rand() < 0.04;
    const zone = site.zones[Math.floor(rand() * site.zones.length)];
    records.push({
      personId: `P-${String(i + 1).padStart(4, '0')}`,
      personName: `${first} ${LAST[Math.floor(rand() * LAST.length)]}`,
      gender: FEMALE.has(first) ? 'female' : 'male',
      zoneId: zone.zoneId,
      zoneName: zone.name,
      severity: zone.securityLevel,
      entryUtc,
      exitUtc: stillInside ? null : exitCandidate,
      dwellMinutes: stillInside ? null : dwellMinutes,
    });
  }
  // Newest first, like a live log.
  return records.sort((a, b) => b.entryUtc - a.entryUtc);
}

export async function demoEntryExit({ siteId, fromUtc, toUtc, pageSize = 50, pageNumber = 1 }) {
  await delay();
  const all = demoRecords(siteId, fromUtc, toUtc);
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  return {
    records: all.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
    totalRecords: all.length,
    totalPages,
    pageNumber,
    pageSize,
  };
}

// Simulated Socket.IO feed for demo sessions: emits events through the same handler the
// real socket uses, so the UI code path is identical.
export function startDemoFeed(emit, getSiteId) {
  let occupancy = {};
  const tick = () => {
    const siteId = getSiteId() || DEMO_SITES[0].siteId;
    const site = DEMO_SITES.find((s) => s.siteId === siteId) || DEMO_SITES[0];
    const cur = occupancy[siteId] ?? crowdAt(Date.now(), siteId, Math.random);
    const action = Math.random() < 0.55 ? 'entry' : 'exit';
    const next = Math.max(0, cur + (action === 'entry' ? 1 : -1) * Math.ceil(Math.random() * 3));
    occupancy = { ...occupancy, [siteId]: next };
    const zone = site.zones[Math.floor(Math.random() * site.zones.length)];
    const first = FIRST[Math.floor(Math.random() * FIRST.length)];
    emit('live_occupancy', { siteId, occupancy: next, zoneId: zone.zoneId });
    emit('alert', {
      siteId,
      action,
      personName: first,
      zoneName: zone.name,
      severity: zone.securityLevel,
      ts: Date.now(),
    });
  };
  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}
