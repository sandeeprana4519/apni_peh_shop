import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { AffiliatePlatform } from '../types';

interface PlatformScrollProps {
  platforms: AffiliatePlatform[];
  selectedPlatform: number | null;
  onSelectPlatform: (platformId: number | null) => void;
}

export const PlatformScroll: React.FC<PlatformScrollProps> = ({
  platforms,
  selectedPlatform,
  onSelectPlatform,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
              Affiliate Platforms
            </h2>
            <p className="text-xs text-slate-500">
              Browse top verified deals across trusted e-commerce merchants
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-xs"
            aria-label="Scroll Platforms Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-xs"
            aria-label="Scroll Platforms Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
      >
        {/* All Platforms button */}
        <button
          onClick={() => onSelectPlatform(null)}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
            selectedPlatform === null
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <span>All Platforms</span>
        </button>

        {platforms.map((plat) => {
          const isSelected = selectedPlatform === plat.id;

          return (
            <button
              key={plat.id}
              onClick={() => onSelectPlatform(isSelected ? null : plat.id)}
              className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all text-xs font-semibold ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-400'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              {/* Platform color indicator dot or icon */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: plat.badge_color || '#2563EB' }}
              />
              <span>{plat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
