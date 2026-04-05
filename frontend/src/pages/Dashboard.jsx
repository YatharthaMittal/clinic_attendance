import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarCheck, CreditCard, AlertTriangle, Plus, TrendingUp, Clock } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useAppStore } from '../store/AppContext';
import { formatCurrency } from '../utils';

const StatCard = ({ icon, label, value, color, sub }) => (
  <Card className="flex-1 min-w-0" gradient>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3
      ${color === 'primary' ? 'bg-primary-100 text-primary-600' :
        color === 'success' ? 'bg-success-100 text-success-600' :
        color === 'warning' ? 'bg-warning-100 text-warning-600' :
        'bg-danger-100 text-danger-600'}
    `}>
      {React.createElement(icon, { size: 18, strokeWidth: 2.5 })}
    </div>
    <div className="text-2xl font-extrabold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    getTodayPatients, getActivePatients, getLowSessionPatients,
    payments, getSessionsRemaining, loading,
  } = useAppStore();

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayPatients = useMemo(() => getTodayPatients(), [getTodayPatients]);
  const activePatients = useMemo(() => getActivePatients(), [getActivePatients]);
  const lowSessionPatients = useMemo(() => getLowSessionPatients(), [getLowSessionPatients]);

  const totalRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );

  if (loading) {
    return (
      <MobileLayout>
        <div className="px-4 py-16 text-center text-gray-500 text-sm">Loading…</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Top banner */}
      <div className="gradient-primary px-5 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-xs font-medium">{today}</p>
              <h1 className="text-white text-xl font-bold mt-0.5">Good Morning, Admin 👋</h1>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="bg-white/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white text-xs font-semibold">{todayPatients.length} patients today</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-4 flex flex-col gap-5">
        {/* Stat cards */}
        <div className="flex gap-3">
          <StatCard icon={CalendarCheck} label="Today" value={todayPatients.length} color="primary" sub="Attended" />
          <StatCard icon={Users} label="Active" value={activePatients.length} color="success" sub="Patients" />
        </div>
        <div className="flex gap-3">
          <StatCard icon={AlertTriangle} label="Low Sessions" value={lowSessionPatients.length} color="warning" sub="Need renewal" />
          <StatCard icon={CreditCard} label="Revenue" value={formatCurrency(totalRevenue)} color="primary" sub="Total collected" />
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <button onClick={() => navigate('/attendance')}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary-600 text-white active:scale-95 transition-transform">
              <CalendarCheck size={22} />
              <span className="text-xs font-semibold">Mark Attendance</span>
            </button>
            <button onClick={() => navigate('/patients/new')}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-success-600 text-white active:scale-95 transition-transform">
              <Plus size={22} />
              <span className="text-xs font-semibold">Add Patient</span>
            </button>
            <button onClick={() => navigate('/payments')}
              className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-transform">
              <CreditCard size={22} />
              <span className="text-xs font-semibold">Payments</span>
            </button>
          </div>
        </div>

        {/* Low session alerts */}
        {lowSessionPatients.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <AlertTriangle size={14} className="text-warning-500" /> Session Alerts
              </h2>
              <Badge color="warning">{lowSessionPatients.length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {lowSessionPatients.map((p) => {
                const remaining = getSessionsRemaining(p);
                return (
                  <Card key={p.id} onClick={() => navigate(`/patients/${p.id}`)} className="border-l-4 border-l-warning-400">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate">{p.injury}</p>
                      </div>
                      <Badge color={remaining <= 0 ? 'danger' : 'warning'}>{remaining} left</Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's patients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Clock size={14} className="text-primary-500" /> Today's Patients
            </h2>
            <button onClick={() => navigate('/patients')} className="text-xs text-primary-600 font-semibold">View All</button>
          </div>
          {todayPatients.length === 0 ? (
            <Card className="text-center py-6">
              <p className="text-gray-400 text-sm">No attendance marked yet today</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/attendance')}>
                Mark Attendance
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {todayPatients.map((p) => (
                <Card key={p.id} onClick={() => navigate(`/patients/${p.id}`)}>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.injury}</p>
                    </div>
                    <Badge color="success" dot>Present</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
