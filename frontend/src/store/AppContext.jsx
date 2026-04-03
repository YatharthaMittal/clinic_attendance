import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  MOCK_PATIENTS,
  MOCK_ATTENDANCE,
  MOCK_PAYMENTS,
} from '../services/mockData';

// ------------------------------------------------------------------
// Context shape
// ------------------------------------------------------------------
const AppContext = createContext(null);

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------
export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState(MOCK_PATIENTS);
  const [attendance, setAttendance] = useState(MOCK_ATTENDANCE);
  const [payments, setPayments] = useState(MOCK_PAYMENTS);

  // ---- Patient actions -------------------------------------------
  const addPatient = useCallback((patientData) => {
    const newPatient = {
      ...patientData,
      id: String(Date.now()),
      sessions_used: 0,
      sessions_total: Number(patientData.sessions_total) || 0,
      status: 'active',
      created_at: new Date().toISOString(),
      last_visit: null,
    };
    setPatients((prev) => [newPatient, ...prev]);
    return newPatient;
  }, []);

  const updatePatient = useCallback((id, updates) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  // ---- Attendance actions ----------------------------------------
  const saveAttendance = useCallback((dateString, attendanceMap) => {
    // attendanceMap: { patientId: boolean }
    const today = dateString;

    // Remove existing records for today first, then add new ones
    setAttendance((prev) => {
      const filtered = prev.filter((a) => a.date !== today);
      const newRecords = Object.entries(attendanceMap).map(([patient_id, present]) => ({
        id: `${today}-${patient_id}`,
        patient_id,
        date: today,
        present,
      }));
      return [...filtered, ...newRecords];
    });

    // Update last_visit and sessions_used for present patients
    setPatients((prev) =>
      prev.map((p) => {
        if (!attendanceMap[p.id]) return p;
        const wasPresent = attendanceMap[p.id];
        if (!wasPresent) return p;
        return {
          ...p,
          last_visit: new Date().toISOString(),
          // Deduct session if advance payment mode
          sessions_used:
            p.payment_mode === 'advance'
              ? Math.min(p.sessions_used + 1, p.sessions_total)
              : p.sessions_used,
        };
      })
    );
  }, []);

  // ---- Payment actions -------------------------------------------
  const addPayment = useCallback((paymentData) => {
    const newPayment = {
      ...paymentData,
      id: String(Date.now()),
      amount: Number(paymentData.amount),
      sessions: Number(paymentData.sessions) || 1,
      created_at: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);

    // If advance payment, increase sessions_total for the patient
    if (paymentData.payment_type === 'advance' && paymentData.sessions) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === paymentData.patient_id
            ? { ...p, sessions_total: p.sessions_total + Number(paymentData.sessions) }
            : p
        )
      );
    }

    return newPayment;
  }, []);

  // ---- Derived helpers -------------------------------------------
  const getPatientById = useCallback(
    (id) => patients.find((p) => p.id === id),
    [patients]
  );

  const getSessionsRemaining = useCallback(
    (patient) => (patient ? patient.sessions_total - patient.sessions_used : 0),
    []
  );

  const getPatientAttendance = useCallback(
    (patientId) =>
      attendance
        .filter((a) => a.patient_id === patientId)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [attendance]
  );

  const getPatientPayments = useCallback(
    (patientId) =>
      payments
        .filter((p) => p.patient_id === patientId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [payments]
  );

  const getTodayAttendance = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.filter((a) => a.date === today);
  }, [attendance]);

  const getTodayPatients = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayIds = attendance
      .filter((a) => a.date === today && a.present)
      .map((a) => a.patient_id);
    return patients.filter((p) => todayIds.includes(p.id));
  }, [patients, attendance]);

  const getActivePatients = useCallback(
    () => patients.filter((p) => p.status === 'active'),
    [patients]
  );

  const getLowSessionPatients = useCallback(
    () =>
      patients.filter((p) => {
        const remaining = p.sessions_total - p.sessions_used;
        return p.payment_mode === 'advance' && remaining <= 2;
      }),
    [patients]
  );

  // ---- Context value ---------------------------------------------
  const value = {
    // State
    patients,
    attendance,
    payments,
    // Actions
    addPatient,
    updatePatient,
    saveAttendance,
    addPayment,
    // Derived helpers
    getPatientById,
    getSessionsRemaining,
    getPatientAttendance,
    getPatientPayments,
    getTodayAttendance,
    getTodayPatients,
    getActivePatients,
    getLowSessionPatients,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------
export const useAppStore = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppProvider>');
  return ctx;
};

export default AppContext;
