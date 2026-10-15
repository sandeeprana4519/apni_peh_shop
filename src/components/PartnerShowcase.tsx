import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, UserCheck } from 'lucide-react';
import { Partner } from '../types';

interface PartnerShowcaseProps {
  partners: Partner[];
  selectedPartner: number | null;
  onSelectPartner: (partnerId: number | null) => void;
}

export const PartnerShowcase: React.FC<PartnerShowcaseProps> = ({
  partners,
  selectedPartner,
  onSelectPartner,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
    }
  };

  if (!partners || partners.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
              Approved Affiliate Partners
            </h2>
            <p className="text-xs text-slate-500">
              Verified influencers and affiliate creators curating recommendations
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-xs"
            aria-label="Scroll Partners Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-xs"
            aria-label="Scroll Partners Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
      >
        {/* All Partners button */}
        <button
          onClick={() => onSelectPartner(null)}
          className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
            selectedPartner === null
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <span>All Partners</span>
        </button>

        {partners.map((p) => {
          const isSelected = selectedPartner === p.id;
          const initials = p.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <button
              key={p.id}
              onClick={() => onSelectPartner(isSelected ? null : p.id)}
              className={`shrink-0 flex items-center gap-3 p-2 pr-4 rounded-xl border transition-all text-left group ${
                isSelected
                  ? 'bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-200'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-2xs'
              }`}
            >
              {/* Profile Avatar / Initials */}
              <div className="relative">
                {p.profile_image ? (
                  <img
                    src={p.profile_image}
                    alt={p.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {initials}
                  </div>
                )}
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 bg-white rounded-full absolute -bottom-0.5 -right-0.5" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                    {p.full_name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-700 font-medium">
                  {p.partner_id}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
