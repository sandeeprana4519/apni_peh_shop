import React from 'react';
import { ArrowRight, Tag, Flame } from 'lucide-react';

interface PromoStripProps {
  onPromoClick?: (tag: string) => void;
}

export const PromoStrip: React.FC<PromoStripProps> = ({ onPromoClick }) => {
  const handleClick = (tag: string) => {
    if (onPromoClick) {
      onPromoClick(tag);
    } else {
      const el = document.getElementById('browse-all-products');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="deals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Banner 1: Summer Sale */}
        <div
          onClick={() => handleClick('sale')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-100/90 via-teal-50 to-emerald-50 border border-emerald-200/60 p-6 sm:p-8 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-300"
        >
          {/* Decorative monstera leaf art representation */}
          <div className="absolute right-4 -bottom-6 w-36 h-36 opacity-30 pointer-events-none text-emerald-800">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0 C60 20, 80 30, 90 50 C100 70, 80 90, 50 100 C20 90, 0 70, 10 50 C20 30, 40 20, 50 0 Z" />
            </svg>
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 text-[11px] font-bold">
              <Tag className="w-3 h-3" />
              <span>Seasonal Specials</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Summer Sale
            </h3>
            <p className="text-emerald-800 font-bold text-lg sm:text-xl">
              Up to 50% OFF
            </p>
            <div className="pt-2">
              <button className="px-5 py-2.5 bg-slate-900 group-hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs">
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Graphical pill / stamp */}
          <div className="relative z-10 hidden sm:flex flex-col items-center justify-center w-24 h-24 rounded-full bg-white/80 backdrop-blur-xs border border-emerald-200 shadow-sm text-center">
            <span className="text-[11px] font-medium text-emerald-700 uppercase">Save Big</span>
            <span className="text-xl font-black text-emerald-600">50%</span>
            <span className="text-[9px] text-slate-400">Direct Links</span>
          </div>
        </div>

        {/* Banner 2: Top Brands Best Deals */}
        <div
          onClick={() => handleClick('top_brands')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-100/90 via-orange-50 to-amber-50 border border-amber-200/60 p-6 sm:p-8 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-300"
        >
          {/* Shopping bag decorative graphic */}
          <div className="absolute right-6 bottom-3 w-28 h-28 opacity-25 pointer-events-none text-amber-700">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6V4a4 4 0 0 0-8 0v2H4v16h16V6h-4zm-6-2a2 2 0 0 1 4 0v2h-4V4zm8 16H6V8h2v2h2V8h4v2h2V8h2v12z" />
            </svg>
          </div>

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-800 text-[11px] font-bold">
              <Flame className="w-3 h-3 text-amber-600" />
              <span>Verified Merchant Deals</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Top Brands
            </h3>
            <p className="text-amber-800 font-bold text-lg sm:text-xl">
              Best Handpicked Deals
            </p>
            <div className="pt-2">
              <button className="px-5 py-2.5 bg-slate-900 group-hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-xs">
                <span>Shop Deals</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative z-10 hidden sm:flex flex-col items-center justify-center w-24 h-24 rounded-full bg-white/80 backdrop-blur-xs border border-amber-200 shadow-sm text-center">
            <span className="text-[11px] font-medium text-amber-700 uppercase">Trusted</span>
            <span className="text-lg font-black text-amber-600">Brands</span>
            <span className="text-[9px] text-slate-400">100% Legit</span>
          </div>
        </div>
      </div>
    </section>
  );
};
