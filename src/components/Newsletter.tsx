import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/50 rounded-2xl border border-blue-100 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
              Stay Updated
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Get notified of fresh affiliate discounts, festive flash sales, and exclusive partner reviews.
            </p>
          </div>
        </div>

        {/* Input & Subscribe CTA */}
        <div className="w-full md:w-auto">
          {subscribed ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-200 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Thank you for subscribing! We'll send you top curated deals.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center w-full max-w-md">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                required
                className="w-full sm:w-72 bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-l-lg py-2.5 px-3.5 border border-r-0 border-slate-300 focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm rounded-r-lg transition-colors whitespace-nowrap shadow-xs"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
