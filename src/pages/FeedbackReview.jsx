import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, useWorkflow } from '../context/AppProvider';
import { APP_BRAND } from '../config/appConfig';
import { Button, Card } from '../components/ui';
import { Star, MessageCircle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from '../components/toast';

const GOOGLE_REVIEW_URL = import.meta.env.VITE_GOOGLE_REVIEW_URL || '';

const FeedbackReview = () => {
  const { activeJobId } = useWorkflow();
  const { jobsDb, saveFeedback } = useData();
  const navigate = useNavigate();
  const job = jobsDb.find(item => item.id === activeJobId) || jobsDb.find(item => item.status === 'Completed');
  const [rating, setRating] = useState(job?.snapshot?.feedback?.rating || 5);
  const [comments, setComments] = useState(job?.snapshot?.feedback?.comments || '');
  const [saving, setSaving] = useState(false);

  if (!job) {
    return (
      <div className="max-w-xl mx-auto text-center p-12">
        <p className="text-slate-500 font-bold mb-4">No completed job found for feedback.</p>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await saveFeedback(job.id, {
        rating,
        comments,
        googleReviewOpened: false,
        managerScore: rating,
        trainingNeed: rating <= 3 ? 'Follow-up required' : '',
      });
      toast.success('Feedback saved.');
    } finally {
      setSaving(false);
    }
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi ${job.customerName}, thank you for visiting ${APP_BRAND.posName}. Please rate your experience: ${GOOGLE_REVIEW_URL || 'Google review link pending setup'}`
    );
    const mobile = job.customerMobile ? `91${job.customerMobile}` : '';
    window.open(`https://wa.me/${mobile}?text=${message}`, '_blank');
  };

  const openGoogle = async () => {
    await saveFeedback(job.id, {
      rating,
      comments,
      googleReviewOpened: true,
      managerScore: rating,
      trainingNeed: rating <= 3 ? 'Follow-up required' : '',
    });
    if (GOOGLE_REVIEW_URL) window.open(GOOGLE_REVIEW_URL, '_blank');
    else toast.warning('Add VITE_GOOGLE_REVIEW_URL to enable the direct Google Review link.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Feedback & Review</h2>
        <p className="text-slate-500 font-medium mt-1">Capture the customer rating and send the review prompt.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Customer</p>
            <p className="text-xl font-black text-slate-900">{job.customerName}</p>
            <p className="text-slate-500 font-semibold">{job.vehicle}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Job</p>
            <p className="font-black text-slate-900">{job.id}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-colors ${
                    value <= rating ? 'bg-amber-50 border-amber-400 text-amber-500' : 'border-slate-200 text-slate-300'
                  }`}
                >
                  <Star fill="currentColor" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Comments</label>
            <textarea
              className="min-h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base shadow-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Customer comments, concerns, or training notes..."
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Button disabled={saving} onClick={save} className="gap-2">
              <CheckCircle2 size={18} /> Save Feedback
            </Button>
            <Button variant="secondary" onClick={shareWhatsApp} className="gap-2">
              <MessageCircle size={18} /> WhatsApp Prompt
            </Button>
            <Button variant="secondary" onClick={openGoogle} className="gap-2">
              <ExternalLink size={18} /> Google Review
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FeedbackReview;
