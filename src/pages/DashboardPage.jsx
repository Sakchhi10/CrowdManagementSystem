import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { errorMessage } from '../api/client';
import { getDemographics, getDwell, getFootfall, getOccupancy } from '../api/endpoints';
import { PersonIcon, TrendDownIcon, TrendUpIcon } from '../components/Icons';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { useLive } from '../live/LiveContext';
import { dayRanges, formatDwell, formatHour, percentChange } from '../utils/time';
import { useAsync } from '../utils/useAsync';

const COLORS = {
  occupancy: '#4b9b95',
  male: '#3f8c86',
  female: '#a9dbd5',
  live: '#b3261e',
};

export default function DashboardPage() {
  const { dateKey } = useOutletContext();
  const { siteId, timeZone, live } = useLive();
  const ranges = useMemo(() => dayRanges(dateKey, timeZone), [dateKey, timeZone]);
  const body = (r) => ({ siteId, ...r });

  // Each widget loads independently and all requests start together, so the page is not
  // bound by the slowest call and one failure doesn't blank the whole dashboard.
  const deps = [siteId, ranges.current.fromUtc, ranges.current.toUtc];
  const occupancy = useAsync(
    () => Promise.all([getOccupancy(body(ranges.current)), getOccupancy(body(ranges.previous))]),
    deps
  );
  const footfall = useAsync(
    () => Promise.all([getFootfall(body(ranges.current)), getFootfall(body(ranges.previous))]),
    deps
  );
  const dwell = useAsync(() => Promise.all([getDwell(body(ranges.current)), getDwell(body(ranges.previous))]), deps);
  const demographics = useAsync(() => getDemographics(body(ranges.current)), deps);

  // Live count from the socket wins while viewing today; otherwise the latest hourly bucket.
  const occ = useMemo(() => {
    if (!occupancy.data) return null;
    const [cur, prev] = occupancy.data;
    const lastBucket = cur.buckets.at(-1)?.value ?? cur.live ?? null;
    const socketValue = ranges.isToday && live ? live.count : null;
    const value = socketValue ?? lastBucket;
    const prevValue = prev.buckets.at(-1)?.value ?? prev.live ?? null;
    return { value, change: percentChange(value, prevValue), buckets: cur.buckets, isLive: socketValue !== null };
  }, [occupancy.data, live, ranges.isToday]);

  const compareLabel = ranges.isToday ? 'yesterday' : 'previous day';

  return (
    <div className="page">
      <PageHeader title="Overview" />

      <h2 className="section-title">Occupancy</h2>
      <div className="stats-row">
        <div className="card stats-group">
          <StatCard
            title="Live Occupancy"
            loading={occupancy.loading && !occupancy.data}
            error={occupancy.error}
            onRetry={occupancy.reload}
            value={occ?.value != null ? Math.round(occ.value).toLocaleString() : '—'}
            change={occ?.change}
            compareLabel={compareLabel}
            live={occ?.isLive}
          />
          <div className="stats-sep" />
          <StatCard
            title={ranges.isToday ? "Today's Footfall" : 'Footfall'}
            loading={footfall.loading && !footfall.data}
            error={footfall.error}
            onRetry={footfall.reload}
            value={footfall.data ? footfall.data[0].footfall.toLocaleString() : '—'}
            change={footfall.data ? percentChange(footfall.data[0].footfall, footfall.data[1].footfall) : null}
            compareLabel={compareLabel}
          />
        </div>
        <div className="card">
          <StatCard
            title="Avg Dwell Time"
            loading={dwell.loading && !dwell.data}
            error={dwell.error}
            onRetry={dwell.reload}
            value={dwell.data ? formatDwell(dwell.data[0].avgDwellMinutes) : '—'}
            change={dwell.data ? percentChange(dwell.data[0].avgDwellMinutes, dwell.data[1].avgDwellMinutes) : null}
            compareLabel={compareLabel}
          />
        </div>
      </div>

      <div className="card chart-card">
        <div className="chart-head">
          <h3>Overall Occupancy</h3>
          <Legend items={[{ label: 'Occupancy', color: COLORS.occupancy }]} />
        </div>
        <OccupancyChart
          state={occupancy}
          buckets={occ?.buckets}
          liveValue={occ?.isLive ? occ.value : null}
          showLive={ranges.isToday}
          timeZone={timeZone}
        />
      </div>

      <h2 className="section-title">Demographics</h2>
      <div className="demo-row">
        <div className="card chart-card">
          <div className="chart-head">
            <h3>Chart of Demographics</h3>
          </div>
          <DemographicsDonut state={demographics} />
        </div>
        <div className="card chart-card">
          <div className="chart-head">
            <h3>Demographics Analysis</h3>
            <Legend
              items={[
                { label: 'Male', color: COLORS.male },
                { label: 'Female', color: COLORS.female },
              ]}
            />
          </div>
          <DemographicsTimeline state={demographics} timeZone={timeZone} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, compareLabel, loading, error, onRetry, live }) {
  return (
    <div className="stat">
      <div className="stat-title">
        {title}
        {live && <span className="live-pill">LIVE</span>}
      </div>
      {loading ? (
        <>
          <Skeleton width={90} height={28} style={{ margin: '10px 0 14px' }} />
          <Skeleton width={160} height={12} />
        </>
      ) : error ? (
        <ErrorState compact message={errorMessage(error, 'Failed to load')} onRetry={onRetry} />
      ) : (
        <>
          <div className="stat-value">{value}</div>
          <ChangeIndicator change={change} compareLabel={compareLabel} />
        </>
      )}
    </div>
  );
}

function ChangeIndicator({ change, compareLabel }) {
  if (change === null || change === undefined || !Number.isFinite(change)) {
    return <div className="stat-change neutral">No comparison data</div>;
  }
  const up = change >= 0;
  return (
    <div className={`stat-change ${up ? 'up' : 'down'}`}>
      {up ? <TrendUpIcon /> : <TrendDownIcon />}
      <span>
        {Math.abs(change).toFixed(0)}% {up ? 'More' : 'Less'} than {compareLabel}
      </span>
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}>
          <span className="legend-dot" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function ChartBody({ state, isEmpty, height = 280, children }) {
  if (state.loading && !state.data) return <Skeleton height={height} />;
  if (state.error)
    return (
      <div style={{ height }} className="chart-center">
        <ErrorState message={errorMessage(state.error, 'Failed to load chart')} onRetry={state.reload} />
      </div>
    );
  if (isEmpty)
    return (
      <div style={{ height }} className="chart-center">
        <EmptyState />
      </div>
    );
  return children;
}

function ChartTooltip({ active, payload, label, timeZone }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="muted">{formatHour(label, timeZone)}</div>
      {payload.map((p) => (
        <div key={p.dataKey}>
          <span className="legend-dot" style={{ background: p.stroke }} /> {p.name}: <b>{Math.round(p.value).toLocaleString()}</b>
        </div>
      ))}
    </div>
  );
}

const axisProps = {
  tick: { fontSize: 12, fill: '#5f6b6a' },
  tickLine: false,
  axisLine: { stroke: '#d9dedd' },
};

function OccupancyChart({ state, buckets, liveValue, showLive, timeZone }) {
  const now = Date.now();
  const data = useMemo(() => {
    const rows = (buckets || []).map((b) => ({ t: b.t, value: b.value }));
    // Extend the line to "now" with the latest socket count so the chart moves in real time.
    if (liveValue !== null && rows.length && now > rows.at(-1).t) rows.push({ t: now, value: liveValue });
    return rows;
  }, [buckets, liveValue, now]);

  return (
    <ChartBody state={state} isEmpty={!data.length}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 20, right: 24, left: 4, bottom: 8 }}>
          <defs>
            <linearGradient id="occFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.occupancy} stopOpacity={0.22} />
              <stop offset="100%" stopColor={COLORS.occupancy} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical horizontal={false} stroke="#eef1f0" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(t) => formatHour(t, timeZone)}
            {...axisProps}
          >
            <Label value="Time" position="insideBottom" offset={-4} style={{ fontSize: 12, fill: '#3a4544' }} />
          </XAxis>
          <YAxis {...axisProps} allowDecimals={false} width={48}>
            <Label value="Count" angle={-90} position="insideLeft" style={{ fontSize: 12, fill: '#3a4544' }} />
          </YAxis>
          <Tooltip content={<ChartTooltip timeZone={timeZone} />} />
          <Area
            type="monotone"
            dataKey="value"
            name="Occupancy"
            stroke={COLORS.occupancy}
            strokeWidth={2}
            fill="url(#occFill)"
            isAnimationActive={false}
          />
          {showLive && data.length > 0 && (
            <ReferenceLine
              x={data.at(-1).t}
              stroke={COLORS.live}
              strokeDasharray="3 3"
              label={<LiveMarker />}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartBody>
  );
}

function LiveMarker({ viewBox }) {
  if (!viewBox) return null;
  return (
    <g transform={`translate(${viewBox.x - 9}, ${viewBox.y - 18})`}>
      <rect width="18" height="34" rx="3" fill={COLORS.live} />
      <text x="9" y="17" fill="#fff" fontSize="8" fontWeight="700" textAnchor="middle" transform="rotate(90 9 17)">
        LIVE
      </text>
    </g>
  );
}

function DemographicsDonut({ state }) {
  const totals = state.data?.totals;
  const sum = totals ? totals.male + totals.female : 0;
  const malePct = sum ? Math.round((totals.male / sum) * 100) : 0;
  const femalePct = sum ? 100 - malePct : 0;
  const data = [
    { name: 'Male', value: totals?.male ?? 0, color: COLORS.male },
    { name: 'Female', value: totals?.female ?? 0, color: COLORS.female },
  ];
  return (
    <ChartBody state={state} isEmpty={!sum} height={260}>
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              cornerRadius={8}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
              <Label
                position="center"
                content={({ viewBox }) => (
                  <g>
                    <text x={viewBox.cx} y={viewBox.cy - 6} textAnchor="middle" fontSize="11" fill="#5f6b6a">
                      Total Crowd
                    </text>
                    <text x={viewBox.cx} y={viewBox.cy + 14} textAnchor="middle" fontSize="16" fontWeight="600" fill="#1d2827">
                      {sum.toLocaleString()}
                    </text>
                  </g>
                )}
              />
            </Pie>
            <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="donut-legend">
          <li>
            <PersonIcon style={{ color: COLORS.male }} />
            <b>{malePct}%</b> Males <span className="muted">({totals?.male.toLocaleString()})</span>
          </li>
          <li>
            <PersonIcon style={{ color: COLORS.female }} />
            <b>{femalePct}%</b> Females <span className="muted">({totals?.female.toLocaleString()})</span>
          </li>
        </ul>
      </div>
    </ChartBody>
  );
}

function DemographicsTimeline({ state, timeZone }) {
  const data = state.data?.buckets || [];
  return (
    <ChartBody state={state} isEmpty={!data.length} height={260}>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 24, left: 4, bottom: 8 }}>
          <defs>
            <linearGradient id="maleFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.male} stopOpacity={0.18} />
              <stop offset="100%" stopColor={COLORS.male} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical horizontal={false} stroke="#eef1f0" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(t) => formatHour(t, timeZone)}
            {...axisProps}
          >
            <Label value="Time" position="insideBottom" offset={-4} style={{ fontSize: 12, fill: '#3a4544' }} />
          </XAxis>
          <YAxis {...axisProps} allowDecimals={false} width={48}>
            <Label value="Count" angle={-90} position="insideLeft" style={{ fontSize: 12, fill: '#3a4544' }} />
          </YAxis>
          <Tooltip content={<ChartTooltip timeZone={timeZone} />} />
          <Area type="monotone" dataKey="male" name="Male" stroke={COLORS.male} strokeWidth={2} fill="url(#maleFill)" isAnimationActive={false} />
          <Area type="monotone" dataKey="female" name="Female" stroke={COLORS.female} strokeWidth={2} fill="none" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartBody>
  );
}
