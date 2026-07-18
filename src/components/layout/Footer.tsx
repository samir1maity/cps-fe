'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Send, MessageSquare, Star, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type FormState = {
  name: string;
  email: string;
  type: 'review' | 'query';
  subject: string;
  message: string;
};

const INITIAL: FormState = { name: '', email: '', type: 'query', subject: '', message: '' };

const Footer: React.FC = () => {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    const res = await api.submitQuery(form);
    setSubmitting(false);
    if (res.success) {
      toast.success('Thanks! We\'ll get back to you soon.');
      setForm(INITIAL);
      setOpen(false);
    } else {
      toast.error(res.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto">
      {/* Query / Review panel — hidden for admins */}
      {!isAdmin && <div className="border-b border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center justify-between py-4 text-left group"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-stone-200 group-hover:text-white transition-colors">
              <MessageSquare className="h-4 w-4 text-[var(--brand-400,#f97316)]" />
              Share a Review or Send Us a Query
            </span>
            {open ? (
              <ChevronUp className="h-4 w-4 text-stone-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-400" />
            )}
          </button>

          {open && (
            <form onSubmit={handleSubmit} className="pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div className="sm:col-span-2 flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="query"
                    checked={form.type === 'query'}
                    onChange={set('type')}
                    className="accent-[var(--brand-500,#f97316)]"
                  />
                  <span className="text-sm text-stone-300 flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Query / Support
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="review"
                    checked={form.type === 'review'}
                    onChange={set('type')}
                    className="accent-[var(--brand-500,#f97316)]"
                  />
                  <span className="text-sm text-stone-300 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" /> Leave a Review
                  </span>
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-stone-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="John Doe"
                  required
                  className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[var(--brand-500,#f97316)]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-stone-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[var(--brand-500,#f97316)]"
                />
              </div>

              {/* Subject */}
              <div className="sm:col-span-2">
                <label className="block text-xs text-stone-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={set('subject')}
                  placeholder={form.type === 'review' ? 'e.g. Loved the duck showpiece!' : 'e.g. Where is my order?'}
                  required
                  className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[var(--brand-500,#f97316)]"
                />
              </div>

              {/* Message */}
              <div className="sm:col-span-2">
                <label className="block text-xs text-stone-400 mb-1">Message</label>
                <textarea
                  value={form.message}
                  onChange={set('message')}
                  rows={4}
                  placeholder={form.type === 'review' ? 'Share your experience with us…' : 'Describe your query in detail…'}
                  required
                  className="w-full bg-stone-800 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[var(--brand-500,#f97316)] resize-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[var(--brand-600,#c2410c)] hover:bg-[var(--brand-700,#9a3412)] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>}

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <span>© {new Date().getFullYear()} Creative Pottery. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="/search" className="hover:text-stone-300 transition-colors">Shop</Link>
          <Link href="/profile" className="hover:text-stone-300 transition-colors">My Account</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
