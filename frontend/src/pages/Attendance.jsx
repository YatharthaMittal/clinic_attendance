import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Users, CalendarDays, History } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';
import { formatDate } from '../utils';

const Attendance = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const { getActivePatients, saveAttendance } = useAppStore();
  const toast = useToast();

  const activePatients = useMemo(() => getActivePatients(), [getActivePatients]);

  const [attendanceMap, setAttendanceMap] = useState(() => {
    const initial = {};
    activePatients.forEach((p) => { initial[p.id] = false; });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;

  const togglePatient = (id) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const markAll = () => {
    const next = {};
    activePatients.forEach((p) => { next[p.id] = true; });
    setAttendanceMap(next);
    setSaved(false);
    toast({ message: 'All patients marked present', type: 'info' });
  };

  const clearAll = () => {
    const next = {};
    activePatients.forEach((p) => { next[p.id] = false; });
    setAttendanceMap(next);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    saveAttendance(today, attendanceMap); // ← writes to global context
    setSaving(false);
    setSaved(true);
    toast({
      message: `Attendance saved! ${presentCount} patient${presentCount !== 1 ? 's' : ''} marked present.`,
      type: 'success',
    });
  };

  return (
    <MobileLayout>
      <Header
        title="Attendance"
        subtitle={formatDate(today)}
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            icon={History}
            onClick={() => navigate('/attendance/history')}
          >
            History
          </Button>
        }
      />

      <div className="px-4 pt-4 pb-44 flex flex-col gap-4">
        <Card gradient>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <CalendarDays size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Today</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(today)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-primary-600">{presentCount}</div>
              <div className="text-xs text-gray-500">/ {activePatients.length} present</div>
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${activePatients.length > 0 ? (presentCount / activePatients.length) * 100 : 0}%` }} />
          </div>
        </Card>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Users} onClick={markAll} className="flex-1">Mark All Present</Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="flex-1 border border-gray-200">Clear All</Button>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Active Patients ({activePatients.length})
          </p>
          <div className="flex flex-col gap-2">
            {activePatients.map((patient) => {
              const isPresent = attendanceMap[patient.id];
              return (
                <div key={patient.id} onClick={() => togglePatient(patient.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 active:scale-95 select-none
                    ${isPresent ? 'bg-success-50 border-success-200' : 'bg-white border-gray-100'}`}>
                  <Avatar name={patient.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isPresent ? 'text-success-800' : 'text-gray-800'}`}>{patient.name}</p>
                    <p className="text-xs text-gray-500 truncate">{patient.injury}</p>
                  </div>
                  <div className={`transition-all duration-200 ${isPresent ? 'text-success-500' : 'text-gray-300'}`}>
                    {isPresent ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={1.5} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 pb-3 pt-3 bg-white border-t border-gray-100 z-50">
        <Button size="full" icon={CheckCircle2} loading={saving} onClick={handleSave} variant={saved ? 'success' : 'primary'}>
          {saved ? 'Attendance Saved ✓' : `Save Attendance (${presentCount} Present)`}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default Attendance;
