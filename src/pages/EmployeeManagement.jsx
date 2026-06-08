import React, { useMemo, useState } from 'react';
import { Button, Card, Input } from '../components/ui';
import { useData } from '../context/AppProvider';
import { BriefcaseBusiness, KeyRound, Mail, Phone, ShieldCheck, UserPlus, Users } from 'lucide-react';

const roles = ['POS Executive', 'Technician', 'Store Manager'];

const roleStyles = {
  'Store Manager': 'bg-primary-50 text-primary-700 ring-primary-100',
  'POS Executive': 'bg-purple-50 text-purple-700 ring-purple-100',
  Technician: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

const roleDescriptions = {
  'Store Manager': 'Full access',
  'POS Executive': 'Customers, estimates, billing',
  Technician: 'Inspections and job floor',
};

const EmployeeManagement = () => {
  const { employeesDb = [], addEmployee } = useData();
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'POS Executive',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const counts = useMemo(() => roles.map(role => ({
    role,
    count: employeesDb.filter(employee => employee.role === role).length,
  })), [employeesDb]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Employee name is required.');
      return;
    }
    if (!form.email.trim()) {
      setError('Work email is required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Temporary password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const employee = await addEmployee(form);
      setSuccess(`${employee.name} was added as ${employee.role}.`);
      setForm({ name: '', email: '', mobile: '', role: 'POS Executive', password: '' });
    } catch (err) {
      setError(err.message || 'Unable to add employee.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Employees</h2>
            <p className="mt-2 max-w-[62ch] text-sm font-semibold leading-6 text-slate-600">
              Add staff, assign operational roles, and keep sign-in access tied to this workshop.
            </p>
          </div>

          <div className="grid w-full grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[520px]">
            {counts.map((item, index) => (
              <div key={item.role} className={`px-4 py-3 ${index > 0 ? 'border-l border-slate-200' : ''}`}>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{item.role.replace('Store ', '')}</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <Card className="h-fit overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
                <UserPlus size={21} />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-slate-950">Add Employee</h3>
                <p className="text-sm font-semibold text-slate-500">Create access in one step.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <Input
              label="Full Name"
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={event => updateField('name', event.target.value)}
              required
            />
            <Input
              label="Work Email"
              type="email"
              placeholder="employee@yourshop.com"
              value={form.email}
              onChange={event => updateField('email', event.target.value)}
              required
            />
            <Input
              label="Mobile"
              type="tel"
              placeholder="10 digits"
              value={form.mobile}
              onChange={event => updateField('mobile', event.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <select
                value={form.role}
                onChange={event => updateField('role', event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-800 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {roles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <p className="text-xs font-semibold text-slate-500">{roleDescriptions[form.role]}</p>
            </div>

            <Input
              label="Temporary Password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={event => updateField('password', event.target.value)}
              required
            />

            {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
            {success && <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{success}</p>}

            <Button type="submit" className="w-full gap-2 bg-slate-950 hover:bg-slate-800" disabled={saving}>
              <UserPlus size={18} />
              {saving ? 'Adding Employee...' : 'Add Employee'}
            </Button>
          </form>
        </Card>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-slate-500" size={22} />
              <h3 className="text-lg font-black tracking-tight text-slate-950">Team Directory</h3>
            </div>
            <p className="text-sm font-semibold text-slate-500">{employeesDb.length} active team member{employeesDb.length !== 1 ? 's' : ''}</p>
          </div>

          {employeesDb.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Users size={28} />
              </div>
              <p className="font-black text-slate-950">No employees added yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                Add your first POS Executive or Technician to start assigning real workshop responsibilities.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {employeesDb.map(employee => (
                <div key={employee.id || employee.email} className="grid gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_210px_140px] md:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <BriefcaseBusiness size={21} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-black tracking-tight text-slate-950">{employee.name}</p>
                        <ShieldCheck className="shrink-0 text-emerald-500" size={17} />
                      </div>
                      <div className="mt-2 flex flex-col gap-1 text-sm font-semibold text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-4">
                        <p className="flex min-w-0 items-center gap-2">
                          <Mail size={15} className="shrink-0 text-slate-400" />
                          <span className="truncate">{employee.email || 'Email not stored'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={15} className="shrink-0 text-slate-400" />
                          <span>{employee.mobile || 'No mobile added'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 md:justify-start">
                    <KeyRound size={16} className="text-slate-400" />
                    <span>{roleDescriptions[employee.role] || 'Employee access'}</span>
                  </div>

                  <div className="md:flex md:justify-end">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ring-1 ${roleStyles[employee.role] || roleStyles['POS Executive']}`}>
                      {employee.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
