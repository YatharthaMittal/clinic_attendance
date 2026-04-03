import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAppStore } from '../store/AppContext';
import { getRelativeTime } from '../utils';
import { PAYMENT_MODES } from '../constants';

const PatientCard = ({ patient, onClick, getSessionsRemaining }) => {
  const remaining = getSessionsRemaining(patient);
  const sessionColor = remaining <= 0 ? 'danger' : remaining <= 2 ? 'warning' : 'success';
  return (
    <Card onClick={onClick} hover>
      <div className="flex items-start gap-3">
        <Avatar name={patient.name} photo={patient.photo} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm text-gray-900 truncate">{patient.name}</p>
            <Badge color={patient.status === 'active' ? 'success' : 'gray'} dot size="sm">{patient.status}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{patient.injury}</p>
          <div className="flex items-center justify-between mt-2.5">
            <Badge color={PAYMENT_MODES[patient.payment_mode]?.color || 'primary'} size="sm">
              {PAYMENT_MODES[patient.payment_mode]?.label || patient.payment_mode}
            </Badge>
            <div className="flex flex-col items-end gap-0.5">
              {patient.payment_mode === 'advance' && (
                <Badge color={sessionColor} size="sm">{remaining} sessions</Badge>
              )}
              <span className="text-[10px] text-gray-400">{getRelativeTime(patient.last_visit)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const PatientList = () => {
  const navigate = useNavigate();
  const { patients, getSessionsRemaining } = useAppStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.injury.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && p.status === 'active') ||
        (filter === 'inactive' && p.status === 'inactive') ||
        (filter === 'low' && getSessionsRemaining(p) <= 2 && p.payment_mode === 'advance');
      return matchesSearch && matchesFilter;
    });
  }, [patients, search, filter, getSessionsRemaining]);

  return (
    <MobileLayout>
      <Header
        title="Patients"
        subtitle={`${patients.length} total patients`}
        showNotification
        rightAction={
          <Button size="sm" icon={Plus} onClick={() => navigate('/patients/new')}>Add</Button>
        }
      />
      <div className="px-4 pt-3 pb-4 flex flex-col gap-4">
        <Input placeholder="Search by name, injury, phone…" value={search} onChange={(e) => setSearch(e.target.value)} icon={Search} />
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {['all', 'active', 'inactive', 'low'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : f === 'inactive' ? 'Inactive' : '⚠️ Low Sessions'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 font-medium">{filtered.length} patients found</p>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No patients found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((patient) => (
              <PatientCard key={patient.id} patient={patient} getSessionsRemaining={getSessionsRemaining}
                onClick={() => navigate(`/patients/${patient.id}`)} />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default PatientList;
