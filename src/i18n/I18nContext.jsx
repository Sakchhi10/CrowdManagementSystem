import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// English / Arabic UI text plus page direction. Data coming from the API (names, zones,
// site names) is shown as-is; only the app's own labels are translated.

const LANG_KEY = 'cms.lang';

const STRINGS = {
  en: {
    'brand.title': 'Crowd Solutions',
    'nav.overview': 'Overview',
    'nav.entries': 'Crowd Entries',
    'nav.logout': 'Logout',
    'nav.toggle': 'Toggle menu',
    'site.label': 'Site',
    'site.loading': 'Loading sites…',
    'site.unavailable': 'Sites unavailable',
    'site.error': 'Could not load sites. Dashboard data needs a site to query.',
    'conn.connected': 'Live',
    'conn.connecting': 'Connecting',
    'conn.demo': 'Demo data',
    'conn.offline': 'Offline',
    'conn.title': 'Live updates: {state}',
    'lang.switch': 'Language',
    'profile': 'Account',
    'alerts.open': 'Alerts ({count} new)',
    'alerts.title': 'Alerts',
    'alerts.close': 'Close alerts',
    'alerts.empty': 'No alerts yet. New entry and exit events will appear here as they happen.',
    'alerts.entered': 'Entered',
    'alerts.exited': 'Exited',
    'severity.high': 'High',
    'severity.medium': 'Medium',
    'severity.low': 'Low',
    'loading': 'Loading…',
    'date.today': 'Today',
    'date.select': 'Select day',
    'state.error': 'Could not load data',
    'state.retry': 'Retry',
    'state.empty': 'No data for this period',
    'state.failed': 'Failed to load',
    'state.chartFailed': 'Failed to load chart',
    'dash.occupancy': 'Occupancy',
    'dash.liveOccupancy': 'Live Occupancy',
    'dash.todaysFootfall': "Today's Footfall",
    'dash.footfall': 'Footfall',
    'dash.avgDwell': 'Avg Dwell Time',
    'dash.overallOccupancy': 'Overall Occupancy',
    'dash.demographics': 'Demographics',
    'dash.demographicsChart': 'Chart of Demographics',
    'dash.demographicsAnalysis': 'Demographics Analysis',
    'dash.totalCrowd': 'Total Crowd',
    'dash.males': 'Males',
    'dash.females': 'Females',
    'dash.male': 'Male',
    'dash.female': 'Female',
    'dash.time': 'Time',
    'dash.count': 'Count',
    'dash.live': 'LIVE',
    'dash.noComparison': 'No comparison data',
    'dash.more': '{pct}% More than {when}',
    'dash.less': '{pct}% Less than {when}',
    'dash.yesterday': 'yesterday',
    'dash.previousDay': 'previous day',
    'entries.name': 'Name',
    'entries.sex': 'Sex',
    'entries.entry': 'Entry',
    'entries.exit': 'Exit',
    'entries.dwell': 'Dwell Time',
    'entries.inside': 'Inside',
    'entries.unknown': 'Unknown',
    'entries.empty': 'No entries recorded for this day',
    'entries.failed': 'Failed to load entries',
    'entries.records': '{count} records',
    'entries.pagination': 'Pagination',
    'entries.prev': 'Previous page',
    'entries.next': 'Next page',
    'login.welcome1': 'Welcome to the',
    'login.welcome2': 'Crowd Management System',
    'login.id': 'Log In',
    'login.idPlaceholder': 'Email or login ID',
    'login.password': 'Password',
    'login.show': 'Show password',
    'login.hide': 'Hide password',
    'login.submit': 'Login',
    'login.submitting': 'Logging in…',
    'login.required': 'Please enter your login ID and password.',
    'login.invalid': 'Invalid login ID or password.',
    'login.tooMany': 'Too many attempts. Please wait a moment and try again.',
    'login.failed': 'Unable to log in. Please try again.',
    'login.expired': 'Your session has expired. Please log in again.',
  },
  ar: {
    'brand.title': 'حلول الحشود',
    'nav.overview': 'نظرة عامة',
    'nav.entries': 'دخول الزوار',
    'nav.logout': 'تسجيل الخروج',
    'nav.toggle': 'تبديل القائمة',
    'site.label': 'الموقع',
    'site.loading': 'جارٍ تحميل المواقع…',
    'site.unavailable': 'المواقع غير متاحة',
    'site.error': 'تعذّر تحميل المواقع. تحتاج بيانات لوحة المعلومات إلى موقع للاستعلام.',
    'conn.connected': 'مباشر',
    'conn.connecting': 'جارٍ الاتصال',
    'conn.demo': 'بيانات تجريبية',
    'conn.offline': 'غير متصل',
    'conn.title': 'التحديثات المباشرة: {state}',
    'lang.switch': 'اللغة',
    'profile': 'الحساب',
    'alerts.open': 'التنبيهات ({count} جديدة)',
    'alerts.title': 'التنبيهات',
    'alerts.close': 'إغلاق التنبيهات',
    'alerts.empty': 'لا توجد تنبيهات بعد. ستظهر أحداث الدخول والخروج الجديدة هنا فور حدوثها.',
    'alerts.entered': 'دخل',
    'alerts.exited': 'خرج',
    'severity.high': 'مرتفع',
    'severity.medium': 'متوسط',
    'severity.low': 'منخفض',
    'loading': 'جارٍ التحميل…',
    'date.today': 'اليوم',
    'date.select': 'اختر اليوم',
    'state.error': 'تعذّر تحميل البيانات',
    'state.retry': 'إعادة المحاولة',
    'state.empty': 'لا توجد بيانات لهذه الفترة',
    'state.failed': 'فشل التحميل',
    'state.chartFailed': 'فشل تحميل الرسم البياني',
    'dash.occupancy': 'الإشغال',
    'dash.liveOccupancy': 'الإشغال المباشر',
    'dash.todaysFootfall': 'عدد الزوار اليوم',
    'dash.footfall': 'عدد الزوار',
    'dash.avgDwell': 'متوسط مدة البقاء',
    'dash.overallOccupancy': 'الإشغال الإجمالي',
    'dash.demographics': 'التركيبة السكانية',
    'dash.demographicsChart': 'مخطط التركيبة السكانية',
    'dash.demographicsAnalysis': 'تحليل التركيبة السكانية',
    'dash.totalCrowd': 'إجمالي الحشد',
    'dash.males': 'ذكور',
    'dash.females': 'إناث',
    'dash.male': 'ذكر',
    'dash.female': 'أنثى',
    'dash.time': 'الوقت',
    'dash.count': 'العدد',
    'dash.live': 'مباشر',
    'dash.noComparison': 'لا توجد بيانات للمقارنة',
    'dash.more': 'أكثر بنسبة {pct}% من {when}',
    'dash.less': 'أقل بنسبة {pct}% من {when}',
    'dash.yesterday': 'الأمس',
    'dash.previousDay': 'اليوم السابق',
    'entries.name': 'الاسم',
    'entries.sex': 'الجنس',
    'entries.entry': 'الدخول',
    'entries.exit': 'الخروج',
    'entries.dwell': 'مدة البقاء',
    'entries.inside': 'بالداخل',
    'entries.unknown': 'غير معروف',
    'entries.empty': 'لا توجد عمليات دخول مسجلة لهذا اليوم',
    'entries.failed': 'فشل تحميل عمليات الدخول',
    'entries.records': '{count} سجل',
    'entries.pagination': 'التنقل بين الصفحات',
    'entries.prev': 'الصفحة السابقة',
    'entries.next': 'الصفحة التالية',
    'login.welcome1': 'مرحبًا بك في',
    'login.welcome2': 'نظام إدارة الحشود',
    'login.id': 'تسجيل الدخول',
    'login.idPlaceholder': 'البريد الإلكتروني أو معرّف الدخول',
    'login.password': 'كلمة المرور',
    'login.show': 'إظهار كلمة المرور',
    'login.hide': 'إخفاء كلمة المرور',
    'login.submit': 'دخول',
    'login.submitting': 'جارٍ تسجيل الدخول…',
    'login.required': 'يرجى إدخال معرّف الدخول وكلمة المرور.',
    'login.invalid': 'معرّف الدخول أو كلمة المرور غير صحيحة.',
    'login.tooMany': 'محاولات كثيرة جدًا. يرجى الانتظار قليلًا ثم المحاولة مرة أخرى.',
    'login.failed': 'تعذّر تسجيل الدخول. يرجى المحاولة مرة أخرى.',
    'login.expired': 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
  },
};

// eslint-disable-next-line react-refresh/only-export-components
export const LANGUAGES = [
  { code: 'en', label: 'En', name: 'English', dir: 'ltr' },
  { code: 'ar', label: 'ع', name: 'العربية', dir: 'rtl' },
];

const I18nContext = createContext(null);

function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && STRINGS[saved]) return saved;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  const dir = LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((code) => {
    setLangState(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  // t('dash.more', { pct: 5 }) -> "5% More than …"; falls back to English, then the key.
  const t = useCallback(
    (key, vars) => {
      const s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
      return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : s;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  return useContext(I18nContext);
}
