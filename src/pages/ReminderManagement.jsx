import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/AppProvider';
import { emailService } from '../services/emailService';
import { Button, Card } from '../components/ui';
import { Bell, CalendarClock, CheckCircle2, Mail, MessageCircle, TimerReset } from 'lucide-react';
import { toast } from '../components/toast';

const getBucket = (reminder) => {
  if (reminder.status === 'done') return 'completed';
  const due = new Date(reminder.dueAt);
  const today = new Date();
  if (due.toDateString() === today.toDateString()) return 'today';
  if (due < today) return 'overdue';
  return 'upcoming';
};

const ReminderManagement = () => {
  const { remindersDb, customersDb, jobsDb, updateReminder, createReminder } = useData();
  const navigate = useNavigate();
  const [activeBucket, setActiveBucket] = useState('today');

  const derivedReminders = useMemo(() => {
    const customerReminders = customersDb
      .filter(customer => customer.nextReminder)
      .map(customer => ({
        id: `customer-${customer.id}`,
        customerId: customer.id,
        customerName: customer.name,
        customerMobile: customer.mobile,
        title: 'Scheduled service reminder',
        notes: 'Customer next reminder date',
        dueAt: customer.nextReminder,
        status: 'open',
        source: 'customer',
        readonly: true,
      }));
    const jobReminders = jobsDb
      .filter(job => job.status === 'Pending Reminder')
      .map(job => ({
        id: `job-${job.id}`,
        customerId: job.customerId,
        vehicleId: job.vehicleId,
        jobId: job.id,
        customerName: job.customerName,
        customerMobile: job.customerMobile,
        vehicleLabel: job.vehicle,
        title: 'Estimate follow-up',
        notes: job.snapshot?.estimate?.decisionRemarks || '',
        dueAt: job.snapshot?.estimate?.reminderDate || job.date,
        status: 'open',
        source: 'estimate',
        readonly: true,
      }));
    return [...remindersDb, ...customerReminders, ...jobReminders];
  }, [customersDb, jobsDb, remindersDb]);

  const buckets = {
    overdue: derivedReminders.filter(reminder => getBucket(reminder) === 'overdue'),
    today: derivedReminders.filter(reminder => getBucket(reminder) === 'today'),
    upcoming: derivedReminders.filter(reminder => getBucket(reminder) === 'upcoming'),
    completed: derivedReminders.filter(reminder => getBucket(reminder) === 'completed'),
  };

  const markDone = async (reminder) => {
    if (reminder.readonly) {
      await createReminder({ ...reminder, id: undefined, source: `${reminder.source}_completed`, status: 'done', completedAt: new Date().toISOString() });
    } else {
      await updateReminder(reminder.id, { status: 'done', completedAt: new Date().toISOString() });
    }
  };

  const snooze = async (reminder) => {
    const due = new Date(reminder.dueAt);
    due.setDate(due.getDate() + 2);
    if (reminder.readonly) {
      await createReminder({ ...reminder, id: undefined, source: `${reminder.source}_snooze`, dueAt: due.toISOString(), status: 'open' });
    } else {
      await updateReminder(reminder.id, { dueAt: due.toISOString(), status: 'open' });
    }
  };

  const sendWhatsApp = (reminder) => {
    const text = encodeURIComponent(`Hi ${reminder.customerName}, this is a reminder from Abahaan POS: ${reminder.title}`);
    window.open(`https://wa.me/91${reminder.customerMobile || ''}?text=${text}`, '_blank');
  };

  const sendEmail = async (reminder) => {
    await emailService.send({
      to: reminder.customerEmail || '',
      subject: reminder.title,
      text: `Hi ${reminder.customerName},\n\n${reminder.notes || reminder.title}\n\nRegards,\nAbahaan POS`,
      customerId: reminder.customerId,
      jobId: reminder.jobId,
    });
    toast.success('Email action opened/sent.');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <Bell className="text-primary-600" /> Reminder Management
        </h2>
        <p className="text-slate-500 font-medium mt-1">Track follow-ups, rechecks, and recovery reminders.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(buckets).map(([bucket, items]) => (
          <button
            key={bucket}
            onClick={() => setActiveBucket(bucket)}
            className={`rounded-2xl border p-4 text-left ${activeBucket === bucket ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-700 border-slate-200'}`}
          >
            <p className="text-xs font-black uppercase tracking-widest">{bucket}</p>
            <p className="text-3xl font-black">{items.length}</p>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {buckets[activeBucket].map(reminder => (
          <Card key={`${reminder.id}-${reminder.source}`} className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="font-black text-slate-900">{reminder.title}</p>
                <p className="text-sm font-semibold text-slate-500">{reminder.customerName || 'Customer'} · {reminder.customerMobile || 'No mobile'}</p>
                <p className="text-sm font-bold text-primary-700 mt-1 flex items-center gap-1"><CalendarClock size={14} /> {new Date(reminder.dueAt).toLocaleString('en-IN')}</p>
                {reminder.notes && <p className="text-sm text-slate-500 mt-1">{reminder.notes}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => markDone(reminder)} className="gap-1"><CheckCircle2 size={14} /> Done</Button>
                <Button size="sm" variant="secondary" onClick={() => snooze(reminder)} className="gap-1"><TimerReset size={14} /> Snooze</Button>
                <Button size="sm" variant="secondary" onClick={() => sendWhatsApp(reminder)} className="gap-1"><MessageCircle size={14} /> WhatsApp</Button>
                <Button size="sm" variant="secondary" onClick={() => sendEmail(reminder)} className="gap-1"><Mail size={14} /> Email</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/lookup')}>Convert</Button>
              </div>
            </div>
          </Card>
        ))}
        {buckets[activeBucket].length === 0 && (
          <Card className="p-12 text-center border-dashed border-2">
            <p className="font-bold text-slate-500">No reminders in this bucket.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReminderManagement;
