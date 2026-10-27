import { getToken } from '../auth/tokenStore';
import client from './client';
import * as demo from './demo';

export const isDemoSession = () => getToken() === demo.DEMO_TOKEN;

// The analytics service answers one request in ~1-6 s, but several at once stall until they
// all time out. So analytics calls go out one at a time, in the order they were made; the
// timeout only starts once a call is actually sent, not while it waits in line. A call whose
// signal was aborted while queued (its page moved on) is skipped instead of sent.
const ANALYTICS_TIMEOUT_MS = 30000;
let analyticsQueue = Promise.resolve();
function postAnalytics(path, body, signal) {
  const run = analyticsQueue.then(() => {
    if (signal?.aborted) throw Object.assign(new Error('Request cancelled'), { name: 'CanceledError' });
    return client.post(path, body, { signal, timeout: ANALYTICS_TIMEOUT_MS });
  });
  analyticsQueue = run.catch(() => {});
  return run;
}

// Response shapes for occupancy/demographics/login are not documented in Swagger,
// so the parsers below accept the common variants instead of a single fixed shape.

function pickNumber(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

function pickArray(data, keys) {
  if (Array.isArray(data)) return data;
  for (const k of keys) {
    if (Array.isArray(data?.[k])) return data[k];
    if (Array.isArray(data?.data?.[k])) return data.data[k];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function bucketTime(b) {
  const t = pickNumber(b, ['utc', 'bucketUtc', 'timeUtc', 'hourUtc', 'fromUtc', 'startUtc', 'timestamp', 'ts', 'time']);
  if (t !== null) return t < 1e12 ? t * 1000 : t; // tolerate epoch seconds
  const s = b?.local || b?.bucketLocal || b?.hour || b?.time;
  const parsed = s ? Date.parse(s) : NaN;
  return Number.isNaN(parsed) ? null : parsed;
}

export async function login(email, password) {
  if (demo.DEMO_EMAIL && email.toLowerCase() === demo.DEMO_EMAIL.toLowerCase() && password === demo.DEMO_PASSWORD) {
    return demo.DEMO_TOKEN;
  }
  const { data } = await client.post('/api/auth/login', { email, password });
  const token = data?.token || data?.accessToken || data?.access_token || data?.jwt || data?.data?.token;
  if (!token) throw new Error('Login succeeded but no token was returned');
  return token;
}

export async function getSites() {
  if (isDemoSession()) return demo.demoSites();
  const { data } = await client.get('/api/sites');
  return pickArray(data, ['sites', 'items']);
}

export async function getFootfall(body, signal) {
  if (isDemoSession()) return demo.demoFootfall(body);
  const { data } = await postAnalytics('/api/analytics/footfall', body, signal);
  return { footfall: pickNumber(data, ['footfall', 'count', 'total']) ?? 0, raw: data };
}

export async function getDwell(body, signal) {
  if (isDemoSession()) return demo.demoDwell(body);
  const { data } = await postAnalytics('/api/analytics/dwell', body, signal);
  return {
    avgDwellMinutes: pickNumber(data, ['avgDwellMinutes', 'averageDwellMinutes', 'avgDwell']) ?? 0,
    dwellRecords: pickNumber(data, ['dwellRecords', 'count']) ?? 0,
  };
}

export async function getOccupancy(body, signal) {
  if (isDemoSession()) return demo.demoOccupancy(body);
  const { data } = await postAnalytics('/api/analytics/occupancy', body, signal);
  const buckets = pickArray(data, ['buckets', 'series', 'timeline', 'hours', 'items'])
    .map((b) => ({
      t: bucketTime(b),
      value: pickNumber(b, ['avg', 'occupancy', 'avgOccupancy', 'count', 'value', 'people', 'total']) ?? 0,
    }))
    .filter((b) => b.t !== null)
    .sort((a, b) => a.t - b.t);
  const live = pickNumber(data, ['liveOccupancy', 'currentOccupancy', 'occupancy', 'current']);
  return { buckets, live };
}

export async function getDemographics(body, signal) {
  if (isDemoSession()) return demo.demoDemographics(body);
  const { data } = await postAnalytics('/api/analytics/demographics', body, signal);
  const buckets = pickArray(data, ['buckets', 'series', 'timeline', 'hours', 'items'])
    .map((b) => ({
      t: bucketTime(b),
      male: pickNumber(b, ['male', 'males', 'maleCount', 'M']) ?? 0,
      female: pickNumber(b, ['female', 'females', 'femaleCount', 'F']) ?? 0,
    }))
    .filter((b) => b.t !== null)
    .sort((a, b) => a.t - b.t);
  const totals = buckets.reduce((acc, b) => ({ male: acc.male + b.male, female: acc.female + b.female }), { male: 0, female: 0 });
  const summaryMale = pickNumber(data, ['totalMale', 'male', 'males']);
  const summaryFemale = pickNumber(data, ['totalFemale', 'female', 'females']);
  return {
    buckets,
    totals: summaryMale !== null && summaryFemale !== null ? { male: summaryMale, female: summaryFemale } : totals,
  };
}

export async function getEntryExit(body, signal) {
  if (isDemoSession()) return demo.demoEntryExit(body);
  const { data } = await postAnalytics('/api/analytics/entry-exit', body, signal);
  return {
    records: pickArray(data, ['records', 'items', 'rows']),
    totalRecords: pickNumber(data, ['totalRecords', 'total']) ?? 0,
    totalPages: pickNumber(data, ['totalPages']) ?? 1,
    pageNumber: pickNumber(data, ['pageNumber', 'page']) ?? body.pageNumber,
    pageSize: pickNumber(data, ['pageSize']) ?? body.pageSize,
  };
}
