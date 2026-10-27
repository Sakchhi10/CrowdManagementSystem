// Small inline icon set so the app ships without an icon library.
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const HomeIcon = (p) => (
  <svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
export const EntriesIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
);
export const LogoutIcon = (p) => (
  <svg {...base} {...p}><path d="M12 3v8" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /></svg>
);
export const BellIcon = (p) => (
  <svg {...base} {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>
);
export const PinIcon = (p) => (
  <svg {...base} {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const CalendarIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const EyeIcon = (p) => (
  <svg {...base} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOffIcon = (p) => (
  <svg {...base} {...p}><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="m3 3 18 18" /></svg>
);
export const CloseIcon = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const MenuIcon = (p) => (
  <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const TrendUpIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
);
export const TrendDownIcon = (p) => (
  <svg {...base} width={16} height={16} {...p}><path d="m3 7 6 6 4-4 8 8" /><path d="M15 17h6v-6" /></svg>
);
export const PersonIcon = (p) => (
  <svg viewBox="0 0 24 24" width={14} height={20} fill="currentColor" aria-hidden {...p}><circle cx="12" cy="4" r="3" /><path d="M8 9h8l1 7h-2.5l-.5 7h-4l-.5-7H7z" /></svg>
);
export const ChevronLeft = (p) => (
  <svg {...base} width={16} height={16} {...p}><path d="m15 18-6-6 6-6" /></svg>
);
export const ChevronRight = (p) => (
  <svg {...base} width={16} height={16} {...p}><path d="m9 18 6-6-6-6" /></svg>
);

export function Logo({ light = true }) {
  const fg = light ? '#fff' : '#1f7a74';
  return (
    <span className="logo" style={{ color: fg }}>
      <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="15" fill={fg} />
        <circle cx="16" cy="14" r="6" fill="none" stroke={light ? '#1f5f5a' : '#fff'} strokeWidth="3" />
        <path d="M12 19v7" stroke={light ? '#1f5f5a' : '#fff'} strokeWidth="3" strokeLinecap="round" />
      </svg>
      kloudspot
    </span>
  );
}
