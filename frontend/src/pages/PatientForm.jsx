import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, User, Phone, Activity, FileText, CreditCard } from 'lucide-react';
import MobileLayout from '../layouts/MobileLayout';
import Header from '../layouts/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppContext';

const PAYMENT_OPTIONS = [
  { value: 'per_session', label: 'Per Session', desc: 'Pay each visit' },
  { value: 'monthly', label: 'Monthly', desc: 'Fixed monthly fee' },
  { value: 'advance', label: 'Advance Sessions', desc: 'Pre-buy sessions' },
];

const defaultForm = {
  name: '', phone: '', injury: '', prescription: '',
  payment_mode: 'per_session', sessions_total: '', status: 'active', photo: null,
};

const PatientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  const toast = useToast();
  const { getPatientById, addPatient, updatePatient } = useAppStore();

  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const patient = getPatientById(id);
      if (patient) {
        setForm({
          name: patient.name, phone: patient.phone, injury: patient.injury,
          prescription: patient.prescription, payment_mode: patient.payment_mode,
          sessions_total: patient.sessions_total, status: patient.status, photo: patient.photo || null,
        });
      }
    }
  }, [id, isEdit, getPatientById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit number';
    if (!form.injury.trim()) errs.injury = 'Injury is required';
    if (form.payment_mode === 'advance' && !form.sessions_total)
      errs.sessions_total = 'Enter total sessions for advance payment';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast({ message: 'Please fix the errors before saving', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updatePatient(id, form);
        toast({ message: 'Patient updated successfully!', type: 'success' });
      } else {
        await addPatient(form);
        toast({ message: 'Patient added successfully!', type: 'success' });
      }
      navigate('/patients');
    } catch (e) {
      toast({
        message: e?.response?.data?.error || 'Could not save patient',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout>
      <Header title={isEdit ? 'Edit Patient' : 'Add Patient'}
        subtitle={isEdit ? 'Update patient information' : 'Register a new patient'} showBack />

      <form onSubmit={handleSubmit} className="px-4 pt-4 pb-44 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            <Avatar name={form.name || 'P'} size="xl" />
            <button type="button" className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
              <Camera size={14} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-gray-400">Tap to upload photo</p>
        </div>

        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Personal Info</p>
          <div className="flex flex-col gap-4">
            <Input label="Full Name" name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Rajesh Kumar" icon={User} required error={errors.name} />
            <Input label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange}
              placeholder="10-digit mobile number" icon={Phone} required error={errors.phone} />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Medical Info</p>
          <div className="flex flex-col gap-4">
            <Input label="Injury / Condition" name="injury" value={form.injury} onChange={handleChange}
              placeholder="e.g. Lower Back Pain" icon={Activity} required error={errors.injury} />
            <Input label="Prescription / Notes" name="prescription" type="textarea" value={form.prescription}
              onChange={handleChange} placeholder="Therapy plan, exercises, notes…" icon={FileText} rows={3} />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Mode</p>
          <div className="flex flex-col gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${form.payment_mode === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}>
                <input type="radio" name="payment_mode" value={opt.value} checked={form.payment_mode === opt.value}
                  onChange={handleChange} className="accent-primary-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {form.payment_mode === 'advance' && (
            <div className="mt-4">
              <Input label="Total Sessions Purchased" name="sessions_total" type="number" value={form.sessions_total}
                onChange={handleChange} placeholder="e.g. 15" icon={CreditCard} required
                error={errors.sessions_total} helper="Number of pre-paid sessions" />
            </div>
          )}
        </Card>

        {isEdit && (
          <Card>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status</p>
            <div className="flex gap-3">
              {['active', 'inactive'].map((s) => (
                <label key={s} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-semibold transition-all
                  ${form.status === s ? (s === 'active' ? 'border-success-500 bg-success-50 text-success-700' : 'border-gray-300 bg-gray-100 text-gray-600') : 'border-gray-100 text-gray-400'}`}>
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={handleChange} className="hidden" />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>
          </Card>
        )}
      </form>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 pb-3 pt-3 bg-white border-t border-gray-100 z-50">
        <Button type="submit" size="full" loading={saving} onClick={handleSubmit}>
          {isEdit ? 'Save Changes' : 'Add Patient'}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default PatientForm;
