import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, Upload, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface PartnerAuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onLoginSuccess: (partner: any) => void;
  onOpenLegalModal: (tab: 'terms' | 'privacy') => void;
}

export const PartnerAuthModal: React.FC<PartnerAuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  onClose,
  onLoginSuccess,
  onOpenLegalModal,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regProfileImage, setRegProfileImage] = useState<string | null>(null);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessData, setRegSuccessData] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    setRegError(null);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setRegProfileImage(data.fileUrl);
      } else {
        setRegError(data.message || 'Image upload failed');
      }
    } catch (err: any) {
      setRegError('Network error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_identifier: loginIdentifier,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (data.success && data.partner) {
        onLoginSuccess(data.partner);
        onClose();
      } else {
        setLoginError(data.message || 'Login failed.');
      }
    } catch (err: any) {
      setLoginError('Server connection error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    if (!regTermsAccepted) {
      setRegError('You must accept the Terms and Conditions and Privacy Policy.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regFullName,
          email: regEmail,
          mobile_number: regMobile,
          password: regPassword,
          confirm_password: regConfirmPassword,
          terms_accepted: regTermsAccepted,
          profile_image: regProfileImage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRegSuccessData(data.partner);
      } else {
        setRegError(data.message || 'Registration failed.');
      }
    } catch (err: any) {
      setRegError('Network error during registration.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="bg-slate-950 p-6 text-center text-white relative">
          <div className="flex justify-center mb-2">
            <BrandLogo showTagline={false} />
          </div>
          <h2 className="text-xl font-bold font-heading text-white">
            {activeTab === 'login' ? 'Partner Portal Login' : 'Affiliate Partner Registration'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'login'
              ? 'Access your product submissions and real-time click statistics'
              : 'Join as a verified affiliate creator. Receive your AP sequential ID.'}
          </p>

          {/* Toggle Tabs */}
          <div className="flex bg-slate-900 rounded-lg p-1 mt-4 border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('login');
                setRegSuccessData(null);
                setLoginError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'login' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Partner Login
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setLoginError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'register' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              New Registration
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Partner ID or Registered Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. AP00001 or rohan.sharma@example.com"
                    required
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg py-2.5 pl-9 pr-3 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="text-[10px] text-slate-400">
                  Demo login: <span className="font-mono text-slate-600">AP00001</span> or <span className="font-mono text-slate-600">rohan.sharma@example.com</span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg py-2.5 pl-9 pr-10 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Demo password: <span className="font-mono text-slate-600">password123</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In to Partner Dashboard'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Don't have a Partner account? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  Register Now
                </button>
              </div>
            </form>
          ) : regSuccessData ? (
            /* Registration Success Screen */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                Registration Received!
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">Assigned Partner ID:</span>
                  <span className="ml-2 font-mono font-bold text-amber-800 text-sm">
                    {regSuccessData.partner_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Applicant Name:</span>
                  <span className="ml-2 font-semibold text-slate-900">
                    {regSuccessData.full_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Approval Status:</span>
                  <span className="ml-2 inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-sm">
                    PENDING ADMIN REVIEW
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                As per platform policy, every new partner application is reviewed by our administrators before dashboard access is activated. You can use our Admin CRM panel at any time to instantly test approving this account.
              </p>
              <button
                onClick={() => {
                  setRegSuccessData(null);
                  setActiveTab('login');
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Proceed to Partner Login
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{regError}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. ramesh@example.com"
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Confirm *</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter"
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Profile Image (Optional with Multer Upload & Preview) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Profile Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {regProfileImage ? (
                    <img
                      src={regProfileImage}
                      alt="Preview"
                      className="w-10 h-10 rounded-full object-cover border border-amber-500"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <label className="cursor-pointer text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 py-1.5 px-3 rounded-lg border border-amber-200 flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Choose from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Acceptance of Terms & Privacy Policy */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regTermsAccepted}
                    onChange={(e) => setRegTermsAccepted(e.target.checked)}
                    required
                    className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegalModal('terms')}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Terms & Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => onOpenLegalModal('privacy')}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={regLoading || uploadingImage}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold rounded-lg text-xs sm:text-sm transition-colors shadow-xs disabled:opacity-50"
              >
                {regLoading ? 'Registering...' : 'Register as Affiliate Partner'}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Log In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
