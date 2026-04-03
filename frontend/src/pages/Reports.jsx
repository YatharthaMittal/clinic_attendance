import React, { useMemo } from 'react';
import { BarChart2, Users, TrendingUp, AlertCircle, CalendarDays } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import { useAppStore } from '../store/AppContext';
import { formatCurrency, formatDate } from '../utils';

const MetricCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => {
  const colors = {
    primary: { bg: 'bg-primary-50', icon: 'text-primary-600', val: 'text-primary-700' },
    success: { bg: 'bg-success-50', icon: 'text-success-600', val: 'text-success-700' },
    warning: { bg: 'bg-warning-50', icon: 'text-warning-600', val: 'text-warning-600' },
    danger:  { bg: 'bg-danger-50',  icon: 'text-danger-500',  val: 'text-danger-600'  },
  };
  const c = colors[color] || colors.primary;
  return (
    <Card className={`flex-1 min-w-0 ${c.bg} border-0`}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 bg-white/70">
        <Icon size={16} className={c.icon} />
      </div>
      <div className={`text-xl font-extrabold ${c.val}`}>{value}</div>
      <div className="text-xs text-gray-600 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
    </Card>
  );
};

const Reports = () => {
  const {
    patients, attendance, payments,
    getActivePatients, getLowSessionPatients, getSessionsRemaining,
  } = useAppStore();

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);

  const todayPresent = useMemo(
    () => attendance.filter((a) => a.date === today && a.present).length,
    [attendance, today]
  );

  const monthlyVisits = useMemo(
    () => attendance.filter((a) => a.date.startsWith(thisMonth) && a.present).length,
    [attendance, thisMonth]
  );

  const totalRevenue = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

  const monthlyRevenue = useMemo(
    () => payments.filter((p) => p.created_at.startsWith(thisMonth)).reduce((sum, p) => sum + p.amount, 0),
    [payments, thisMonth]
  );

  const activePatients = useMemo(() => getActivePatients(), [getActivePatients]);
  const lowSessions   = useMemo(() => getLowSessionPatients(), [getLowSessionPatients]);

  const breakdown = useMemo(() => {
    const modes = { per_session: 0, monthly: 0, advance: 0 };
    patients.forEach((p) => { if (modes[p.payment_mode] !== undefined) modes[p.payment_mode]++; });
    return modes;
  }, [patients]);

  const recentPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
    [payments]
  );

  return (
    <MobileLayout>
      <Header title="Reports" subtitle={`As of ${formatDate(today)}`} />

      <div className="px-4 pt-4 pb-8 flex flex-col gap-5">

        {/* Visits */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Visits Overview</p>
          <div className="flex gap-3">
            <MetricCard icon={CalendarDays} label="Today's Visits" value={todayPresent} sub="Patients seen today" color="primary" />
            <MetricCard icon={Users} label="Monthly Visits" value={monthlyVisits}
              sub={new Date().toLocaleDateString('en-IN', { month: 'long' })} color="success" />
          </div>
        </div>

        {/* Revenue */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Revenue</p>
          <div className="flex gap-3">
            <MetricCard icon={TrendingUp} label="Total Revenue"   value={formatCurrency(totalRevenue)}   color="primary" />
            <MetricCard icon={TrendingUp} label="This Month"      value={formatCurrency(monthlyRevenue)} color="success" />
          </div>
        </div>

        {/* Patients summary */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Patients</p>
          <div className="flex gap-3">
            <MetricCard icon={Users}       label="Active"      value={activePatients.length} color="success" />
            <MetricCard icon={AlertCircle} label="Low Sessions" value={lowSessions.length} sub="Need renewal"
              color={lowSessions.length > 0 ? 'warning' : 'success'} />
          </div>
        </div>

        {/* Payment mode breakdown */}
        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Breakdown</p>
          <div className="flex flex-col gap-3">
            {[
              { key: 'advance',     label: 'Advance Sessions', color: 'bg-primary-500' },
              { key: 'monthly',     label: 'Monthly',          color: 'bg-purple-500'  },
              { key: 'per_session', label: 'Per Session',      color: 'bg-blue-500'    },
            ].map(({ key, label, color }) => {
              const count = breakdown[key];
              const pct   = patients.length > 0 ? (count / patients.length) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                    <span>{label}</span>
                    <span>{count} patients ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Low session alerts */}
        {lowSessions.length > 0 && (
          <Card className="border-l-4 border-l-warning-400">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={15} className="text-warning-500" />
              <p className="text-sm font-bold text-gray-700">Session Renewal Needed</p>
              <Badge color="warning">{lowSessions.length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {lowSessions.map((p) => {
                const rem = getSessionsRemaining(p);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar name={p.name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    </div>
                    <Badge color={rem <= 0 ? 'danger' : 'warning'} size="sm">{rem} left</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent payments */}
        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Payments</p>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No payments recorded yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentPayments.map((pay) => {
                const patient = patients.find((p) => p.id === pay.patient_id);
                return (
                  <div key={pay.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      {patient && <Avatar name={patient.name} size="xs" />}
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{patient?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{formatDate(pay.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-extrabold text-success-600">{formatCurrency(pay.amount)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </MobileLayout>
  );
};

export default Reports;
