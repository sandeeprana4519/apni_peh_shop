import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Laptop, Shirt, Armchair, Sparkles, Dumbbell, Smile, Footprints, Tag, Grid } from 'lucide-react';
import { Category } from '../types';

interface CategoryScrollProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Smartphone: <Laptop className="w-6 h-6 text-slate-700" />,
  Shirt: <Shirt className="w-6 h-6 text-pink-600" />,
  Armchair: <Armchair className="w-6 h-6 text-amber-600" />,
  Sparkles: <Sparkles className="w-6 h-6 text-purple-600" />,
  Dumbbell: <Dumbbell className="w-6 h-6 text-blue-600" />,
  Smile: <Smile className="w-6 h-6 text-amber-500" />,
  Footprints: <Footprints className="w-6 h-6 text-emerald-600" />,
  Tag: <Tag className="w-6 h-6 text-rose-600" />,
};

export const CategoryScroll: React.FC<CategoryScrollProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
            Popular Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Explore curated affiliate products across trending industries
          </p>
        </div>

        {/* Desktop Navigation Arrows */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-xs"
            aria-label="Scroll Categories Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-xs"
            aria-label="Scroll Categories Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {/* 'All Categories' Option */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex flex-col items-center gap-2.5 shrink-0 group focus:outline-hidden transition-transform active:scale-95`}
          style={{ scrollSnapAlign: 'start' }}
        >
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
              selectedCategory === null
                ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                : 'bg-slate-100 group-hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Grid className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span
            className={`text-xs font-medium text-center whitespace-nowrap ${
              selectedCategory === null ? 'text-blue-600 font-bold' : 'text-slate-700 group-hover:text-slate-900'
            }`}
          >
            All Items
          </span>
        </button>

        {/* Categories list */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const icon = iconMap[cat.icon_name || ''] || <Tag className="w-6 h-6 text-slate-600" />;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center gap-2.5 shrink-0 group focus:outline-hidden transition-transform active:scale-95`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 shadow-md ring-4 ring-blue-100'
                    : 'bg-slate-100/90 group-hover:bg-slate-200/90 border border-slate-200/60 shadow-xs'
                }`}
              >
                {icon}
              </div>
              <span
                className={`text-xs font-medium text-center whitespace-nowrap ${
                  isSelected ? 'text-blue-600 font-bold' : 'text-slate-700 group-hover:text-slate-900'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
