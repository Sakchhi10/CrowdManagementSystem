import { useMemo, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { getEntryExit } from '../api/endpoints';
import { ChevronLeft, ChevronRight } from '../components/Icons';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { useLive } from '../live/LiveContext';
import { dayRanges, formatDwellShort, formatTime } from '../utils/time';
import { useAsync } from '../utils/useAsync';

const PAGE_SIZE = 15;

export default function EntriesPage() {
  const { dateKey } = useOutletContext();
  const { siteId, timeZone } = useLive();
  const [page, setPage] = useState(1);
  const ranges = useMemo(() => dayRanges(dateKey, timeZone), [dateKey, timeZone]);

  // Back to the first page whenever the site or day changes.
  useEffect(() => setPage(1), [siteId, dateKey]);

  // One page per request; the server does the paging.
  const { data, loading, error, reload } = useAsync(
    () => getEntryExit({ siteId, ...ranges.current, pageSize: PAGE_SIZE, pageNumber: page }),
    [siteId, ranges.current.fromUtc, ranges.current.toUtc, page]
  );

  const totalPages = Math.max(1, data?.totalPages || 1);
  const records = data?.records || [];

  return (
    <div className="page">
      <PageHeader title="Crowd Entries" />
      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sex</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Dwell Time</th>
            </tr>
          </thead>
          <tbody className={loading && data ? 'refreshing' : ''}>
            {loading && !data &&
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }, (__, j) => (
                    <td key={j}>
                      <Skeleton width={j === 0 ? 140 : 70} height={12} />
                    </td>
                  ))}
                </tr>
              ))}
            {error && (
              <tr>
                <td colSpan={5}>
                  <ErrorState message={errorMessage(error, 'Failed to load entries')} onRetry={reload} />
                </td>
              </tr>
            )}
            {!error && data && records.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState>No entries recorded for this day</EmptyState>
                </td>
              </tr>
            )}
            {!error &&
              records.map((r, i) => {
                const inside = r.exitUtc === null || r.exitUtc === undefined;
                return (
                  <tr key={`${r.personId}-${r.entryUtc}-${i}`}>
                    <td>
                      <span className="person">
                        <span className="avatar" aria-hidden>
                          {(r.personName || '?').trim()[0]}
                        </span>
                        {r.personName || r.personId || 'Unknown'}
                      </span>
                    </td>
                    <td>{formatGender(r.gender ?? r.sex)}</td>
                    <td>{r.entryUtc ? formatTime(r.entryUtc, timeZone) : r.entryLocal || '—'}</td>
                    <td>{inside ? <span className="inside-badge">Inside</span> : formatTime(r.exitUtc, timeZone)}</td>
                    <td>{inside ? '—' : formatDwellShort(r.dwellMinutes)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {data && totalPages > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} disabled={loading} total={data.totalRecords} />
      )}
    </div>
  );
}

function formatGender(g) {
  if (!g) return '—';
  const s = String(g).toLowerCase();
  if (s.startsWith('m')) return 'Male';
  if (s.startsWith('f')) return 'Female';
  return g;
}

// 1 2 3 … 10 style page list around the current page.
function pageList(page, total) {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…' + p);
    out.push(p);
  });
  return out;
}

function Pagination({ page, totalPages, onChange, disabled, total }) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted page-count">{total?.toLocaleString()} records</span>
      <button type="button" className="page-btn" onClick={() => onChange(page - 1)} disabled={disabled || page <= 1} aria-label="Previous page">
        <ChevronLeft />
      </button>
      {pageList(page, totalPages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="page-gap">
            …
          </span>
        ) : (
          <button
            type="button"
            key={p}
            className={`page-btn${p === page ? ' active' : ''}`}
            onClick={() => onChange(p)}
            disabled={disabled}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight />
      </button>
    </nav>
  );
}
