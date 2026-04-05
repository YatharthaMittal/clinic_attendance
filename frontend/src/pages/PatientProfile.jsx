import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, CalendarCheck, CreditCard, Phone, Activity, FileText, ChevronRight } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';
import { formatDate, formatCurrency, getRelativeTime } from '../utils';
import { PAYMENT_MODES } from '../constants';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 font-semibold mt-0.5 leading-snug">{value || '—'}</p>
    </div>
  </div>
);

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    getPatientById,
    getSessionsRemaining,
    getPatientAttendance,
    getPatientPayments,
    markPatientPresent,
    attendance,
    loading,
  } = useAppStore();
  const [markingPresent, setMarkingPresent] = useState(false);

  const patient = useMemo(() => getPatientById(id), [id, getPatientById]);
  const patientAttendance = useMemo(() => getPatientAttendance(id), [id, getPatientAttendance]);
  const patientPayments = useMemo(() => getPatientPayments(id), [id, getPatientPayments]);

  if (loading) {
    return (
      <MobileLayout>
        <Header title="Patient Profile" showBack />
        <div className="px-4 py-12 text-center text-gray-500 text-sm">Loading…</div>
      </MobileLayout>
    );
  }

  if (!patient) {
    return (
      <MobileLayout>
        <Header title="Patient Profile" showBack />
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">Patient not found.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/patients')}>Back</Button>
        </div>
      </MobileLayout>
    );
  }

  const remaining = getSessionsRemaining(patient);
  const sessionColor = remaining <= 0 ? 'danger' : remaining <= 2 ? 'warning' : 'success';
  const presentCount = patientAttendance.filter((a) => a.present).length;

  const handleMarkPresent = async () => {
    const today = new Date().toISOString().split('T')[0];
    const alreadyMarked = attendance.find(
      (a) => a.patient_id === id && a.date === today && a.present
    );
    if (alreadyMarked) {
      toast({ message: 'Already marked present today!', type: 'info' });
      return;
    }
    setMarkingPresent(true);
    try {
      await markPatientPresent(id, today);
      toast({ message: `${patient.name} marked present for today!`, type: 'success' });
    } catch {
      toast({ message: 'Could not mark attendance', type: 'error' });
    } finally {
      setMarkingPresent(false);
    }
  };

  return (
    <MobileLayout>
      <Header title="Patient Profile" showBack
        rightAction={
          <Button size="sm" variant="ghost" icon={Edit2} onClick={() => navigate(`/patients/${id}/edit`)}>Edit</Button>
        }
      />
      <div className="px-4 pt-4 pb-32 flex flex-col gap-4">
        <Card gradient>
          <div className="flex items-center gap-4">
            <Avatar name={patient.name} photo={patient.photo} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-extrabold text-gray-900 truncate">{patient.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{patient.injury}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge color={patient.status === 'active' ? 'success' : 'gray'} dot>{patient.status}</Badge>
                <Badge color={PAYMENT_MODES[patient.payment_mode]?.color || 'primary'}>
                  {PAYMENT_MODES[patient.payment_mode]?.label}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {patient.payment_mode === 'advance' && (
          <Card>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sessions</p>
            <div className="flex gap-3">
              <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-extrabold text-gray-800">{patient.sessions_total}</div>
                <div className="text-xs text-gray-500 mt-0.5">Bought</div>
              </div>
              <div className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-extrabold text-gray-800">{patient.sessions_used}</div>
                <div className="text-xs text-gray-500 mt-0.5">Used</div>
              </div>
              <div className={`flex-1 text-center p-3 rounded-xl
                ${sessionColor === 'danger' ? 'bg-danger-50' : sessionColor === 'warning' ? 'bg-warning-50' : 'bg-success-50'}`}>
                <div className={`text-xl font-extrabold ${sessionColor === 'danger' ? 'text-danger-600' : sessionColor === 'warning' ? 'text-warning-600' : 'text-success-600'}`}>
                  {remaining}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Remaining</div>
              </div>
            </div>
            {remaining <= 2 && (
              <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2
                ${remaining <= 0 ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600'}`}>
                ⚠️ {remaining <= 0 ? 'Sessions exhausted! Please renew.' : `Only ${remaining} session(s) left.`}
              </div>
            )}
          </Card>
        )}

        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Details</p>
          <InfoRow icon={Phone} label="Phone" value={patient.phone} />
          <InfoRow icon={Activity} label="Injury / Condition" value={patient.injury} />
          <InfoRow icon={FileText} label="Prescription" value={patient.prescription} />
          <InfoRow icon={CalendarCheck} label="Last Visit" value={getRelativeTime(patient.last_visit)} />
          <InfoRow icon={CreditCard} label="Payment Mode" value={PAYMENT_MODES[patient.payment_mode]?.label} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attendance</p>
            <Badge color="primary">{presentCount} present</Badge>
          </div>
          {patientAttendance.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No attendance records yet</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {patientAttendance.slice(0, 7).map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 font-medium">{formatDate(a.date)}</span>
                  <Badge color={a.present ? 'success' : 'danger'} size="sm" dot>{a.present ? 'Present' : 'Absent'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment History</p>
            <button onClick={() => navigate(`/payments?patient=${id}`)} className="flex items-center gap-1 text-xs text-primary-600 font-semibold">
              Add <ChevronRight size={12} />
            </button>
          </div>
          {patientPayments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No payments recorded</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {patientPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-800 font-semibold">{formatCurrency(pay.amount)}</p>
                    <p className="text-xs text-gray-400">{formatDate(pay.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <Badge color="primary" size="sm">{pay.sessions} sessions</Badge>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{pay.payment_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 pb-5 pt-3 bg-white border-t border-gray-100 z-50">
        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" icon={CreditCard}
            onClick={() => navigate(`/payments?patient=${id}`)}>Add Payment</Button>
          <Button size="md" className="flex-1" icon={CalendarCheck} loading={markingPresent} onClick={handleMarkPresent}>
            Mark Present
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PatientProfile;
