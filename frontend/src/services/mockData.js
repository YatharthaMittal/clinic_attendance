// Mock data for all entities

export const MOCK_PATIENTS = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    photo: null,
    injury: 'Lower Back Pain',
    prescription: 'Hot pack therapy, TENS for 20 mins, Core strengthening exercises',
    payment_mode: 'advance',
    sessions_total: 15,
    sessions_used: 13,
    status: 'active',
    created_at: '2025-03-01T09:00:00Z',
    last_visit: '2025-03-28T10:00:00Z',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '9811223344',
    photo: null,
    injury: 'Frozen Shoulder',
    prescription: 'Ultrasound therapy, pendulum exercises, passive ROM stretching',
    payment_mode: 'monthly',
    sessions_total: 20,
    sessions_used: 8,
    status: 'active',
    created_at: '2025-03-05T09:00:00Z',
    last_visit: '2025-03-27T11:00:00Z',
  },
  {
    id: '3',
    name: 'Anil Verma',
    phone: '9900112233',
    photo: null,
    injury: 'Knee Osteoarthritis',
    prescription: 'Aquatic therapy, quadriceps strengthening, knee bracing',
    payment_mode: 'per_session',
    sessions_total: 10,
    sessions_used: 10,
    status: 'inactive',
    created_at: '2025-02-10T09:00:00Z',
    last_visit: '2025-03-20T09:30:00Z',
  },
  {
    id: '4',
    name: 'Sunita Patel',
    phone: '9988776655',
    photo: null,
    injury: 'Cervical Spondylosis',
    prescription: 'Cervical traction, IFT, neck isometrics',
    payment_mode: 'advance',
    sessions_total: 12,
    sessions_used: 11,
    status: 'active',
    created_at: '2025-03-10T09:00:00Z',
    last_visit: '2025-03-29T09:00:00Z',
  },
  {
    id: '5',
    name: 'Mehul Joshi',
    phone: '9112233445',
    photo: null,
    injury: 'Plantar Fasciitis',
    prescription: 'Ultrasound, arch support, calf stretching program',
    payment_mode: 'monthly',
    sessions_total: 18,
    sessions_used: 5,
    status: 'active',
    created_at: '2025-03-15T09:00:00Z',
    last_visit: '2025-03-28T14:00:00Z',
  },
  {
    id: '6',
    name: 'Deepa Nair',
    phone: '9771234567',
    photo: null,
    injury: 'Post-ACL Surgery Rehab',
    prescription: 'Progressive resistance training, balance board, gait re-education',
    payment_mode: 'advance',
    sessions_total: 24,
    sessions_used: 22,
    status: 'active',
    created_at: '2025-01-15T09:00:00Z',
    last_visit: '2025-03-29T10:30:00Z',
  },
];

export const MOCK_ATTENDANCE = [
  { id: '1', patient_id: '1', date: '2025-03-29', present: true },
  { id: '2', patient_id: '2', date: '2025-03-29', present: true },
  { id: '3', patient_id: '4', date: '2025-03-29', present: true },
  { id: '4', patient_id: '6', date: '2025-03-29', present: true },
  { id: '5', patient_id: '1', date: '2025-03-28', present: true },
  { id: '6', patient_id: '2', date: '2025-03-28', present: true },
  { id: '7', patient_id: '5', date: '2025-03-28', present: true },
  { id: '8', patient_id: '1', date: '2025-03-27', present: true },
  { id: '9', patient_id: '3', date: '2025-03-27', present: true },
  { id: '10', patient_id: '4', date: '2025-03-27', present: false },
];

export const MOCK_PAYMENTS = [
  { id: '1', patient_id: '1', amount: 2500, payment_type: 'advance', sessions: 15, created_at: '2025-03-01T09:00:00Z' },
  { id: '2', patient_id: '2', amount: 3000, payment_type: 'monthly', sessions: 20, created_at: '2025-03-05T09:00:00Z' },
  { id: '3', patient_id: '4', amount: 2000, payment_type: 'advance', sessions: 12, created_at: '2025-03-10T09:00:00Z' },
  { id: '4', patient_id: '5', amount: 3000, payment_type: 'monthly', sessions: 18, created_at: '2025-03-15T09:00:00Z' },
  { id: '5', patient_id: '6', amount: 5000, payment_type: 'advance', sessions: 24, created_at: '2025-01-15T09:00:00Z' },
  { id: '6', patient_id: '3', amount: 500, payment_type: 'per_session', sessions: 1, created_at: '2025-03-20T09:30:00Z' },
];

export const getSessionsRemaining = (patient) => {
  return patient.sessions_total - patient.sessions_used;
};

export const getTodayPatients = () => {
  const today = new Date().toISOString().split('T')[0];
  const todayIds = MOCK_ATTENDANCE
    .filter(a => a.date === today && a.present)
    .map(a => a.patient_id);
  return MOCK_PATIENTS.filter(p => todayIds.includes(p.id));
};

export const getActivePatients = () => {
  return MOCK_PATIENTS.filter(p => p.status === 'active');
};

export const getLowSessionPatients = () => {
  return MOCK_PATIENTS.filter(p => {
    const remaining = getSessionsRemaining(p);
    return p.payment_mode === 'advance' && remaining <= 2;
  });
};

export const getPendingPaymentPatients = () => {
  return MOCK_PATIENTS.filter(p => p.payment_mode === 'per_session');
};

export const getPatientAttendance = (patientId) => {
  return MOCK_ATTENDANCE
    .filter(a => a.patient_id === patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getPatientPayments = (patientId) => {
  return MOCK_PAYMENTS
    .filter(p => p.patient_id === patientId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getTodayAttendance = () => {
  const today = new Date().toISOString().split('T')[0];
  return MOCK_ATTENDANCE.filter(a => a.date === today);
};
