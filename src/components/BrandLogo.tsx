import React from 'react';

interface BrandLogoProps {
  className?: string;
  name?: string;
  tagline?: string;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  name = 'APNI PEHCHAAN',
  tagline = 'Your Style Your Identity',
  showTagline = true,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Metallic Gold & Onyx Monogram Mark based on Image 2 */}
      <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black rounded-lg shadow-sm border border-amber-500/30 p-1">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D77F" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#AA7C11" />
            </linearGradient>
            <linearGradient id="blackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#333333" />
              <stop offset="100%" stopColor="#111111" />
            </linearGradient>
          </defs>
          {/* Stylized 'A' leg */}
          <path
            d="M20 85 L44 22 L56 22 L38 85 Z"
            fill="url(#blackGrad)"
            stroke="#555"
            strokeWidth="0.5"
          />
          {/* Swirling Golden Figure / Swoosh */}
          <path
            d="M15 72 C 30 68, 48 55, 54 38 C 58 45, 62 48, 70 48 C 60 56, 44 75, 15 72 Z"
            fill="url(#goldGrad)"
          />
          {/* Head dot of dynamic human silhouette */}
          <circle cx="53" cy="27" r="5" fill="url(#goldGrad)" />
          {/* Stylized 'P' curve */}
          <path
            d="M57 24 C 76 24, 88 34, 88 47 C 88 60, 74 69, 58 69 L 58 85 L 50 85 L 50 24 Z M 58 35 L 58 58 C 70 58, 78 54, 78 47 C 78 39, 70 35, 58 35 Z"
            fill="url(#goldGrad)"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="text-lg md:text-xl font-bold tracking-tight text-slate-900 font-heading leading-tight flex items-center gap-1.5">
          {name}
        </span>
        {showTagline && tagline && (
          <span className="text-[10px] md:text-[11px] font-medium tracking-wider text-amber-700 uppercase -mt-0.5">
            — {tagline} —
          </span>
        )}
      </div>
    </div>
  );
};
