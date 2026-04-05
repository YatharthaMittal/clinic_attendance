import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, CreditCard, History } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Input from '../components/Input';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';
import { formatDate, formatCurrency } from '../utils';
import { PAYMENT_MODES } from '../constants';

const PAYMENT_TYPES = [
  { value: 'advance', label: 'Advance Sessions' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'per_session', label: 'Per Session' },
];

const Payments = () => {
  const [searchParams] = useSearchParams();
  const defaultPatient = searchParams.get('patient') || '';
  const [showForm, setShowForm] = useState(Boolean(defaultPatient));
  const toast = useToast();
  const { patients, payments, addPayment, getSessionsRemaining } = useAppStore();

  const [form, setForm] = useState({
    patient_id: defaultPatient, amount: '', payment_type: 'advance', sessions: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) { toast({ message: 'Please select a patient', type: 'error' }); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast({ message: 'Please enter a valid amount', type: 'error' }); return; }

    setSaving(true);
    try {
      await addPayment(form);
      setShowForm(false);
      setForm({ patient_id: '', amount: '', payment_type: 'advance', sessions: '' });
      toast({ message: 'Payment recorded successfully!', type: 'success' });
    } catch (e) {
      toast({
        message: e?.response?.data?.error || 'Could not record payment',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // payments from context, sorted newest first
  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [payments]
  );
  const totalRevenue = useMemo(() => payments.reduce((s, p) => s + p.amount, 0), [payments]);

  const getPatient = (id) => patients.find((p) => p.id === id);

  return (
    <MobileLayout>
      <Header title="Payments" subtitle="Track & record payments"
        rightAction={
          <Button size="sm" icon={Plus} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add'}
          </Button>
        }
      />
      <div className="px-4 pt-4 pb-8 flex flex-col gap-5">
        {showForm && (
          <Card>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">New Payment</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Patient <span className="text-danger-500">*</span></label>
                <select name="patient_id" value={form.patient_id} onChange={handleChange} required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100">
                  <option value="">Select patient…</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Type</label>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_TYPES.map((t) => (
                    <label key={t.value} className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-2 transition-all
                      ${form.payment_type === t.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-gray-600'}`}>
                      <input type="radio" name="payment_type" value={t.value} checked={form.payment_type === t.value} onChange={handleChange} className="hidden" />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
              <Input label="Amount (₹)" name="amount" type="number" value={form.amount} onChange={handleChange}
                placeholder="e.g. 2500" required icon={CreditCard} />
              {form.payment_type === 'advance' && (
                <Input label="Sessions Added" name="sessions" type="number" value={form.sessions} onChange={handleChange}
                  placeholder="e.g. 10" helper="Sessions being purchased" />
              )}
              <Button type="submit" size="full" loading={saving} icon={Plus}>Record Payment</Button>
            </form>
          </Card>
        )}

        <div className="flex gap-3">
          <Card className="flex-1 text-center">
            <div className="text-xl font-extrabold text-primary-600">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-0.5">Total Collected</p>
          </Card>
          <Card className="flex-1 text-center">
            <div className="text-xl font-extrabold text-gray-800">{payments.length}</div>
            <p className="text-xs text-gray-500 mt-0.5">Transactions</p>
          </Card>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <History size={14} className="text-gray-500" />
            <p className="text-sm font-bold text-gray-700">Payment History</p>
          </div>
          <div className="flex flex-col gap-3">
            {sortedPayments.map((pay) => {
              const patient = getPatient(pay.patient_id);
              const remaining = patient ? getSessionsRemaining(patient) : 0;
              return (
                <Card key={pay.id}>
                  <div className="flex items-center gap-3">
                    {patient && <Avatar name={patient.name} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{formatDate(pay.created_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-extrabold text-gray-900">{formatCurrency(pay.amount)}</p>
                      <Badge color={PAYMENT_MODES[pay.payment_type]?.color || 'primary'} size="sm">{pay.sessions} sessions</Badge>
                    </div>
                  </div>
                  {patient?.payment_mode === 'advance' && (
                    <div className={`mt-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                      ${remaining <= 2 ? 'bg-warning-50 text-warning-600' : 'bg-success-50 text-success-700'}`}>
                      {remaining} sessions remaining
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Payments;
