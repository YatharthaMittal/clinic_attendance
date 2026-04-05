import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getToken,
  fetchPatients,
  fetchAttendance,
  fetchPayments,
  saveAttendanceBulk,
  createPatient,
  updatePatient,
  createPayment,
  markPresentRequest,
} from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (!getToken()) {
      setPatients([]);
      setAttendance([]);
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [p, a, pay] = await Promise.all([
        fetchPatients(),
        fetchAttendance(),
        fetchPayments(),
      ]);
      setPatients(p);
      setAttendance(a);
      setPayments(pay);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load data');
      setPatients([]);
      setAttendance([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addPatient = useCallback(
    async (patientData) => {
      const body = {
        name: patientData.name,
        phone: patientData.phone,
        injury: patientData.injury,
        prescription: patientData.prescription || '',
        payment_mode: patientData.payment_mode,
        sessions_total:
          patientData.payment_mode === 'advance' ? patientData.sessions_total : 0,
        photo: patientData.photo || null,
      };
      const created = await createPatient(body);
      await loadAll();
      return created;
    },
    [loadAll]
  );

  const updatePatientById = useCallback(
    async (id, updates) => {
      const body = {
        name: updates.name,
        phone: updates.phone,
        injury: updates.injury,
        prescription: updates.prescription,
        payment_mode: updates.payment_mode,
        status: updates.status,
        photo: updates.photo,
      };
      if (updates.payment_mode === 'advance' && updates.sessions_total !== undefined) {
        body.sessions_total = Number(updates.sessions_total);
      }
      const updated = await updatePatient(id, body);
      await loadAll();
      return updated;
    },
    [loadAll]
  );

  const saveAttendance = useCallback(
    async (dateString, attendanceMap) => {
      const entries = Object.entries(attendanceMap).map(([patient_id, present]) => ({
        patient_id,
        present: Boolean(present),
      }));
      await saveAttendanceBulk(dateString, entries);
      await loadAll();
    },
    [loadAll]
  );

  const addPayment = useCallback(
    async (paymentData) => {
      await createPayment({
        patient_id: paymentData.patient_id,
        amount: Number(paymentData.amount),
        payment_type: paymentData.payment_type,
        sessions: paymentData.sessions,
      });
      await loadAll();
    },
    [loadAll]
  );

  const markPatientPresent = useCallback(
    async (patientId, date) => {
      await markPresentRequest(patientId, date);
      await loadAll();
    },
    [loadAll]
  );

  const getPatientById = useCallback(
    (id) => patients.find((p) => p.id === id),
    [patients]
  );

  const getSessionsRemaining = useCallback((patient) => {
    if (!patient) return 0;
    return patient.sessions_total - patient.sessions_used;
  }, []);

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

  const value = {
    patients,
    attendance,
    payments,
    loading,
    error,
    refresh: loadAll,
    addPatient,
    updatePatient: updatePatientById,
    saveAttendance,
    addPayment,
    markPatientPresent,
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

export const useAppStore = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppProvider>');
  return ctx;
};

export default AppContext;
