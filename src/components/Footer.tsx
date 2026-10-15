import React from 'react';
import { Youtube, Instagram, MessageCircle, Facebook, Send, ShieldAlert, ArrowUp } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface FooterProps {
  settings: WebsiteSettings;
  onOpenLegalModal: (tab: 'about' | 'contact' | 'privacy' | 'terms' | 'disclosure' | 'disclaimer') => void;
  onOpenPartnerAuth: (initialTab?: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenLegalModal,
  onOpenPartnerAuth,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const websiteName = settings.website_name || 'Apni Pehchaan';

  return (
    <footer className="bg-slate-950 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 p-1 flex items-center justify-center text-slate-950 font-black text-sm">
                AP
              </div>
              <div>
                <span className="text-xl font-extrabold text-white font-heading tracking-tight">
                  {websiteName}
                </span>
                <span className="block text-[10px] text-amber-400 font-medium tracking-widest uppercase">
                  — {settings.tagline || 'Your Style Your Identity'} —
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Your premier destination for verified multi-platform e-commerce recommendations. We curate deals from Amazon, Flipkart, and Meesho through vetted partner creators.
            </p>

            {/* Social Media Links (YouTube, Instagram, WhatsApp, Facebook, WhatsApp Channel) */}
            <div className="pt-2 flex items-center gap-3">
              {settings.social_youtube && (
                <a
                  href={settings.social_youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-red-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-pink-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.social_whatsapp && (
                <a
                  href={settings.social_whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-emerald-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.social_whatsapp_channel && (
                <a
                  href={settings.social_whatsapp_channel}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp Channel"
                  className="w-8 h-8 rounded-full bg-slate-900 hover:bg-teal-500 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  title="WhatsApp Channel"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Store Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={scrollToTop}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <a href="#featured" className="text-slate-400 hover:text-white transition-colors">
                  Featured Products
                </a>
              </li>
              <li>
                <a href="#trending" className="text-slate-400 hover:text-white transition-colors">
                  Trending Recommendations
                </a>
              </li>
              <li>
                <a href="#deals" className="text-slate-400 hover:text-white transition-colors">
                  Seasonal Deals
                </a>
              </li>
              <li>
                <a href="#browse-all-products" className="text-slate-400 hover:text-white transition-colors">
                  All Products Catalog
                </a>
              </li>
            </ul>
          </div>

          {/* Partner Portal Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Affiliate Partners</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenPartnerAuth('login')}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Partner Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPartnerAuth('register')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Partner Registration
                </button>
              </li>
              <li>
                <span className="text-[11px] text-slate-500 block pt-1">
                  Sequential Partner IDs (AP00001+) assigned automatically upon approval.
                </span>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenLegalModal('about')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalModal('contact')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalModal('privacy')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalModal('terms')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalModal('disclosure')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Affiliate Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalModal('disclaimer')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Disclaimer
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Affiliate Disclosure Statement */}
        <div id="affiliate-disclosure" className="py-6 border-b border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-slate-300">Mandatory Affiliate Disclosure: </span>
            {settings.affiliate_disclosure ||
              'Apni Pehchaan is a participant in affiliate advertising programs including Amazon Associates, Flipkart Affiliate, and Meesho Influencer Program. When you click Buy Now, you will be redirected to the official merchant site at no extra cost to you. Clicking an affiliate link does not guarantee a completed purchase or fixed commission.'}
          </p>
        </div>

        {/* Bottom Attribution Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="text-center sm:text-left space-y-0.5">
            <div>© 2026 {websiteName}. All Rights Reserved.</div>
            <div className="text-amber-500/90 font-medium">Design by Happiiz Business Solutions.</div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-500 font-mono">Hostinger MySQL Ready</span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              title="Back to Top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="text-[11px]">Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
