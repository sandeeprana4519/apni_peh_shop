import React, { useState } from 'react';
import { ExternalLink, Star, Heart, UserCheck } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const [imageError, setImageError] = useState(false);

  const discountPercent =
    product.original_mrp && product.price && product.original_mrp > product.price
      ? Math.round(((product.original_mrp - product.price) / product.original_mrp) * 100)
      : null;

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Redirect through the tracked analytics endpoint
    window.open(`/api/click/${product.id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Product Image Section */}
      <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden p-4">
        {imageError || !product.image_url ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 rounded-lg p-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-1">
              <span className="text-xs font-bold text-slate-600">AP</span>
            </div>
            <span className="text-[11px] font-medium text-center text-slate-500 line-clamp-1">
              {product.product_name}
            </span>
          </div>
        ) : (
          <img
            src={product.image_url}
            alt={product.product_name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* Wishlist Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center transition-colors shadow-2xs hover:scale-110 ${
            isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
        </button>

        {/* Discount Badge */}
        {discountPercent && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold rounded-md shadow-2xs">
            {discountPercent}% OFF
          </span>
        )}

        {/* Platform Badge Overlay */}
        <div className="absolute bottom-2 left-2.5">
          <span
            className="px-2 py-0.5 text-[10px] font-bold text-white rounded-md shadow-2xs"
            style={{ backgroundColor: product.platform_badge_color || '#2563EB' }}
          >
            {product.platform_name || 'Store'}
          </span>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="flex flex-col flex-1 p-3.5 space-y-2">
        {/* Category Label */}
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider line-clamp-1">
          {product.category_name || 'General'}
        </div>

        {/* Product Name */}
        <h3
          className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
          title={product.product_name}
        >
          {product.product_name}
        </h3>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 pt-0.5">
          {product.price !== null && product.price !== undefined ? (
            <>
              <span className="text-sm sm:text-base font-bold text-slate-900 tabular-nums">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              {product.original_mrp && product.original_mrp > product.price && (
                <span className="text-xs text-slate-400 line-through tabular-nums">
                  ₹{Number(product.original_mrp).toLocaleString('en-IN')}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs font-semibold text-slate-600">Check Best Price</span>
          )}
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="ml-1 font-bold text-slate-800 text-[11px]">{product.rating || '4.5'}</span>
          </div>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] text-slate-500">({product.reviews_count || 45})</span>
        </div>

        {/* Push button to bottom */}
        <div className="pt-2 mt-auto">
          <button
            onClick={handleBuyNow}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>Buy Now</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
