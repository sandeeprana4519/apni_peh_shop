import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Banner } from '../types';

interface BannerCarouselProps {
  banners: Banner[];
  onCtaClick?: (link: string) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onCtaClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Default fallback banners if none loaded yet
  const displayBanners = banners.length > 0 ? banners : [
    {
      id: 1,
      title: 'Upgrade Your Everyday',
      subtitle: 'Top brands. Great prices. Better you.',
      image_url: '',
      cta_text: 'Shop Now',
      cta_link: '#featured',
      badge_text: 'New Arrivals',
      banner_type: 'HERO',
      display_order: 1,
      is_active: 1,
    },
    {
      id: 2,
      title: 'Festive Style & Identity',
      subtitle: 'Discover trending apparel and modern accessories with guaranteed discounts.',
      image_url: '',
      cta_text: 'Explore Fashion',
      cta_link: '#trending',
      badge_text: 'Editor Choice',
      banner_type: 'HERO',
      display_order: 2,
      is_active: 1,
    },
  ];

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [displayBanners.length]);

  const current = displayBanners[currentIndex];

  const handleCta = (link: string) => {
    if (onCtaClick) {
      onCtaClick(link);
    } else if (link.startsWith('#')) {
      const el = document.querySelector(link);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 via-slate-50 to-blue-50/80 border border-slate-200/80 min-h-[300px] sm:min-h-[360px] md:min-h-[400px] flex items-center">
        {/* Soft background glow circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-6 sm:p-10 md:p-12 relative z-10">
          {/* Left Text Zone */}
          <div className="md:col-span-7 space-y-4 md:space-y-6">
            {current.badge_text && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold tracking-wide uppercase">
                <span>{current.badge_text}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] font-heading text-balance">
              {current.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
              {current.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleCta(current.cta_link)}
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 group"
              >
                <span>{current.cta_text || 'Shop Now'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Verified multi-platform deals
              </span>
            </div>
          </div>

          {/* Right Product Showcase Art matching Image 1 */}
          <div className="md:col-span-5 flex justify-center items-center relative">
            <div className="relative w-full max-w-sm aspect-4/3 sm:aspect-square flex items-center justify-center">
              {/* Artistic E-Commerce Podiums Representation */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Visual Devices Display */}
                <div className="relative z-10 w-full flex items-center justify-center gap-3">
                  {/* Studio Headphones Mock Graphic */}
                  <div className="w-36 h-44 bg-gradient-to-b from-slate-100 to-slate-200 rounded-2xl border border-slate-300 shadow-xl flex flex-col items-center justify-center p-3 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-700 flex items-center justify-center bg-slate-800 shadow-inner">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-amber-400">HI-RES</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-800 mt-2">Audio Pro</span>
                    <span className="text-[10px] text-blue-600 font-semibold">₹2,999</span>
                  </div>

                  {/* Smartphone & Smartwatch Mock */}
                  <div className="flex flex-col gap-2">
                    {/* Smartphone */}
                    <div className="w-24 h-36 bg-slate-900 rounded-xl p-1.5 shadow-lg border border-slate-700">
                      <div className="w-full h-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 rounded-lg flex flex-col items-center justify-between p-1.5 text-white">
                        <div className="w-8 h-1 bg-white/40 rounded-full mx-auto" />
                        <span className="text-[10px] font-bold text-center leading-tight">5G OLED</span>
                        <div className="text-[9px] bg-black/40 px-1 rounded-sm">Hot Deal</div>
                      </div>
                    </div>

                    {/* Smart Watch */}
                    <div className="w-20 h-16 bg-slate-800 rounded-lg p-1.5 border border-slate-700 shadow-md flex items-center justify-center">
                      <div className="text-center">
                        <span className="block text-[8px] text-slate-400">AMOLED</span>
                        <span className="block text-[10px] font-bold text-emerald-400">100% Fit</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle base podium */}
                <div className="absolute bottom-2 w-72 h-10 bg-slate-300/40 rounded-full blur-md -z-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        {displayBanners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all z-20 hover:scale-105"
              aria-label="Previous Banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % displayBanners.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition-all z-20 hover:scale-105"
              aria-label="Next Banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots Navigation */}
        {displayBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {displayBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
