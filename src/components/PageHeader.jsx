import { useOutletContext } from 'react-router-dom';
import { CalendarIcon } from './Icons';

// Page title plus the shared day picker ("Today" in the design).
export default function PageHeader({ title }) {
  const { dateKey, setDateKey, today } = useOutletContext();
  return (
    <div className="page-head">
      <h1>{title}</h1>
      <label className="date-pick">
        <CalendarIcon width={16} height={16} />
        <span className="date-label">{dateKey === today ? 'Today' : dateKey}</span>
        <input
          type="date"
          value={dateKey}
          max={today}
          onChange={(e) => e.target.value && setDateKey(e.target.value)}
          aria-label="Select day"
        />
      </label>
    </div>
  );
}
