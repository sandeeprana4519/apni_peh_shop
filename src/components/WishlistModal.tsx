import React from 'react';
import { X, Heart, ExternalLink, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (productId: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onOpenDetails,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-white">Your Saved Wishlist</h3>
              <p className="text-xs text-slate-400">{wishlist.length} saved products</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {wishlist.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Your wishlist is empty</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Click the heart icon on any product to save it here for quick access later.
              </p>
            </div>
          ) : (
            wishlist.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/60 transition-colors"
              >
                <div
                  onClick={() => {
                    onOpenDetails(prod);
                    onClose();
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <img
                    src={prod.image_url}
                    alt={prod.product_name}
                    className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {prod.product_name}
                    </h5>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className="font-bold text-slate-900 tabular-nums">
                        {prod.price ? `₹${Number(prod.price).toLocaleString('en-IN')}` : 'Check Price'}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] font-semibold text-blue-600">{prod.platform_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/api/click/${prod.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Buy Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onRemoveFromWishlist(prod.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
