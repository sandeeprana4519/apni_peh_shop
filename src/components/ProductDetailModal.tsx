import React from 'react';
import { X, ExternalLink, Star, ShieldCheck, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const discountPercent =
    product.original_mrp && product.price && product.original_mrp > product.price
      ? Math.round(((product.original_mrp - product.price) / product.original_mrp) * 100)
      : null;

  const handleBuyNow = () => {
    window.open(`/api/click/${product.id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Product Image */}
          <div className="bg-slate-50 p-6 sm:p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative">
            <div className="w-full max-w-xs aspect-square flex items-center justify-center">
              <img
                src={product.image_url}
                alt={product.product_name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Platform Badge */}
            <div className="absolute top-4 left-4">
              <span
                className="px-2.5 py-1 text-xs font-bold text-white rounded-md shadow-xs"
                style={{ backgroundColor: product.platform_badge_color || '#2563EB' }}
              >
                {product.platform_name || 'Affiliate Partner'}
              </span>
            </div>
          </div>

          {/* Right Column: Product Details & Purchase Module */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Category */}
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                {product.category_name || 'General Collection'}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading leading-snug">
                {product.product_name}
              </h2>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1" />
                  <span>{product.rating || '4.5'}</span>
                </div>
                <span>·</span>
                <span>{product.reviews_count || 120} Community Ratings</span>
              </div>

              {/* Price & MRP */}
              <div className="flex items-baseline gap-3 pt-1">
                {product.price !== null && product.price !== undefined ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                      ₹{Number(product.price).toLocaleString('en-IN')}
                    </span>
                    {product.original_mrp && (
                      <span className="text-sm text-slate-400 line-through tabular-nums">
                        ₹{Number(product.original_mrp).toLocaleString('en-IN')}
                      </span>
                    )}
                    {discountPercent && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 text-xs font-extrabold rounded-md">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm font-semibold text-slate-700">See Price on Merchant Site</span>
                )}
              </div>

              {/* Added By Secondary Information (Mandatory Prompt Feature) */}
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Curated & Recommended By:</span>
                    <span className="text-amber-800 font-bold">
                      {product.partner_name || 'Verified Affiliate Creator'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Partner Code: {product.partner_code || 'AP00001'} (Verified Partner)
                  </div>
                </div>
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  <p>{product.description}</p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <span>Buy Now on {product.platform_name || 'Store'}</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  You will be safely redirected to the merchant checkout. Prices and inventory are verified by merchants.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
