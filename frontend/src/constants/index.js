export const PAYMENT_MODES = {
  per_session: { label: 'Per Session', color: 'blue' },
  monthly: { label: 'Monthly', color: 'purple' },
  advance: { label: 'Advance Sessions', color: 'teal' },
};

export const PATIENT_STATUS = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'gray' },
};

export const SESSION_WARNING_THRESHOLD = 2;

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: 'Home' },
  { path: '/attendance', label: 'Attend', icon: 'CalendarCheck' },
  { path: '/patients', label: 'Patients', icon: 'Users' },
  { path: '/payments', label: 'Payments', icon: 'CreditCard' },
  { path: '/reports', label: 'Reports', icon: 'BarChart2' },
];
