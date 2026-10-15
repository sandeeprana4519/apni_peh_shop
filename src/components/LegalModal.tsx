import React, { useState } from 'react';
import { X, Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface LegalModalProps {
  isOpen: boolean;
  tab: 'about' | 'contact' | 'privacy' | 'terms' | 'disclosure' | 'disclaimer';
  onClose: () => void;
  settings: WebsiteSettings;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, tab, onClose, settings }) => {
  const [activeTab, setActiveTab] = useState(tab);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  React.useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  if (!isOpen) return null;

  const websiteName = settings.website_name || 'Apni Pehchaan';

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold font-heading text-white">
              {activeTab === 'about' && 'About ' + websiteName}
              {activeTab === 'contact' && 'Contact Support & Inquiries'}
              {activeTab === 'privacy' && 'Privacy Policy'}
              {activeTab === 'terms' && 'Terms and Conditions'}
              {activeTab === 'disclosure' && 'Affiliate Disclosure'}
              {activeTab === 'disclaimer' && 'Platform Disclaimer'}
            </h3>
            <p className="text-xs text-slate-400">Official legal and corporate information</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(['about', 'contact', 'privacy', 'terms', 'disclosure', 'disclaimer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setContactSubmitted(false);
              }}
              className={`py-3 px-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 capitalize ${
                activeTab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'about' && 'About Us'}
              {t === 'contact' && 'Contact Us'}
              {t === 'privacy' && 'Privacy Policy'}
              {t === 'terms' && 'Terms & Conditions'}
              {t === 'disclosure' && 'Affiliate Disclosure'}
              {t === 'disclaimer' && 'Disclaimer'}
            </button>
          ))}
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-slate-900">Empowering Smart Online Shopping</h4>
              <p>
                <strong>{websiteName}</strong> is an affiliate aggregation and product recommendation platform founded to connect digital shoppers with verified deals across India’s leading e-commerce platforms including Amazon, Flipkart, Meesho, Myntra, and Ajio.
              </p>
              <p>
                Through our verified affiliate partner program (designated with sequential IDs such as AP00001), experienced creators and trend curators review, vet, and share exceptional products. We prioritize transparent pricing, authentic customer feedback, and direct redirection to trusted merchant checkouts.
              </p>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Our Mission:</strong> To eliminate fake discount claims and clutter by presenting only vetted, high-value deals with full affiliate transparency.
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Email Support</span>
                  </div>
                  <div className="text-xs text-slate-600">{settings.contact_email || 'support@apnipehchaan.com'}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Helpline Phone</span>
                  </div>
                  <div className="text-xs text-slate-600">{settings.contact_phone || '+91 98765 43210'}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Registered Office</span>
                  </div>
                  <div className="text-[11px] text-slate-600">{settings.contact_address || 'Connaught Place, New Delhi, India'}</div>
                </div>
              </div>

              {contactSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs">Message Sent Successfully!</h5>
                    <p className="text-[11px]">Thank you for reaching out. Our support team will respond within 24-48 business hours.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Send us an Inquiry</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                    />
                    <input
                      type="email"
                      placeholder="Your Email Address"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                    />
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe your inquiry or question..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900"
                  />
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-900">Privacy Policy</h4>
              <p>
                At {websiteName}, we are dedicated to safeguarding your privacy. This policy outlines how information is handled when you browse our website or register as an affiliate partner.
              </p>
              <h5 className="font-bold text-slate-800 text-xs">1. Information We Collect</h5>
              <p>
                - <strong>Visitors:</strong> We log non-personal analytical click data (product ID, platform ID, timestamp, and referring URL) strictly to monitor outbound link reliability and referral traffic. We do not store personal financial or payment information.
              </p>
              <p>
                - <strong>Partners:</strong> When registering as an affiliate partner, we collect your full name, email address, mobile number, and password (stored with cryptographic bcrypt one-way hashing).
              </p>
              <h5 className="font-bold text-slate-800 text-xs">2. Cookies and Sessions</h5>
              <p>
                We use secure, HTTP-only server-side session cookies to authenticate logged-in affiliate partners and platform administrators.
              </p>
              <h5 className="font-bold text-slate-800 text-xs">3. External Links</h5>
              <p>
                When you click 'Buy Now', you navigate to external merchants. Those platforms have independent privacy policies.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-900">Terms and Conditions</h4>
              <p>
                By using {websiteName} or registering as an affiliate partner, you agree to these Terms and Conditions.
              </p>
              <h5 className="font-bold text-slate-800 text-xs">1. Partner Account Rules</h5>
              <p>
                All partner registrations receive a unique sequential Partner ID (e.g. AP00001) generated safely on our server. Every account is placed in PENDING status until reviewed and approved by administrators.
              </p>
              <h5 className="font-bold text-slate-800 text-xs">2. Product Submissions</h5>
              <p>
                Partners may only submit legitimate affiliate links to real, commercially available products on authorized merchant platforms (Amazon, Flipkart, Meesho, Myntra). Misleading pricing, deceptive links, or counterfeit products are strictly prohibited.
              </p>
              <h5 className="font-bold text-slate-800 text-xs">3. Account Moderation</h5>
              <p>
                Administrators reserve the right to approve, reject, or suspend accounts or submissions that fail to meet quality guidelines.
              </p>
            </div>
          )}

          {activeTab === 'disclosure' && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-900">Affiliate Disclosure</h4>
              <p>
                {settings.affiliate_disclosure ||
                  'Apni Pehchaan is a participant in affiliate advertising programs including Amazon Associates, Flipkart Affiliate, and Meesho Influencer Program. When you click Buy Now, you will be redirected to the official merchant site at no extra cost to you.'}
              </p>
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
                <div className="font-bold">Key Facts:</div>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>You pay the exact same price as shopping directly on the merchant platform.</li>
                  <li>Our referral links do not inflate product prices or shipping fees.</li>
                  <li>Clicking 'Buy Now' records an outbound analytics click and does not represent a completed transaction.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-900">Disclaimer</h4>
              <p>
                Product information, including images, specifications, prices, discounts, and availability, are provided for informational and reference purposes only. Final transaction prices, return policies, warranties, and shipping are solely determined and fulfilled by the respective merchant platform (e.g., Amazon, Flipkart, Meesho).
              </p>
              <p>
                {websiteName} does not warehouse, sell, process payments for, or deliver physical goods directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
