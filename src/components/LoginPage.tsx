/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Globe,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Camera,
  Upload,
  X,
  Send,
  HelpCircle,
  Crown,
  Sparkles,
  Zap
} from 'lucide-react';
import { Logo } from './Logo';
import { triggerFirebaseEmailVerification, triggerFirebasePasswordReset } from '../firebase';
import type { AuthSessionPayload } from '../types';

interface LoginPageProps {
  onAuthSuccess: (session: AuthSessionPayload) => void;
  initialTab?: 'LOGIN' | 'REGISTER' | 'VERIFY' | 'FORGOT_PASSWORD';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onAuthSuccess,
  initialTab = 'LOGIN'
}) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'VERIFY' | 'FORGOT_PASSWORD'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRepeatPassword, setRegRepeatPassword] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState<string>('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('Global');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email Verification Screen States
  const [verificationTargetEmail, setVerificationTargetEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [activeOtpHint, setActiveOtpHint] = useState<string | null>(null);

  // Auto-detect one-click verification URL parameters (?verifyEmail=...&code=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('verifyEmail');
      const codeParam = urlParams.get('code');

      if (emailParam && codeParam) {
        setVerificationTargetEmail(emailParam);
        setVerifyCode(codeParam);
        setActiveTab('VERIFY');
        setSuccessMsg(`Deep-link verification code detected for ${emailParam}. Verifying...`);

        // Automatically verify
        fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailParam, code: codeParam })
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) {
              setSuccessMsg('Account verified successfully via secure email link! Welcome back.');
              if (data.session) {
                setTimeout(() => {
                  onAuthSuccess(data.session);
                }, 800);
              } else {
                setLoginEmail(emailParam);
                setActiveTab('LOGIN');
              }
            } else {
              setError(data.message || 'Invalid verification link or expired code.');
            }
          })
          .catch(() => {
            setError('Verification failed. Please enter the code manually.');
          });
      } else if (emailParam) {
        setVerificationTargetEmail(emailParam);
        setActiveTab('VERIFY');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Forgot Password Screen States
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSentTargetEmail, setResetSentTargetEmail] = useState<string | null>(null);

  // Handle Profile Photo Upload & Conversion to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError('Profile photo size should be under 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRegAvatarUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Sign In Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // If unverified, display email verification screen as requested
        if (data.requiresVerification) {
          const target = data.email || loginEmail;
          setVerificationTargetEmail(target);
          if (data.verificationCode) {
            setActiveOtpHint(data.verificationCode);
            setVerifyCode(data.verificationCode);
          }
          await triggerFirebaseEmailVerification(target);
          setActiveTab('VERIFY');
          return;
        }

        throw new Error(data.message || 'Incorrect password or email.');
      }

      setSuccessMsg(data.message || 'Authentication confirmed. Welcome back!');
      if (data.session) {
        onAuthSuccess(data.session);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Master Admin Quick Sign In
  const handleMasterAdminLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    setLoginEmail('dj20pndmix@gmail.com');
    setLoginPassword('admin123');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dj20pndmix@gmail.com', password: 'admin123' })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSuccessMsg('👑 Master Admin authenticated. Opening Command Center...');
        onAuthSuccess(data.session);
      } else {
        throw new Error(data.message || 'Master Admin login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate Admin');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Instant Guest / Bettor Sign In
  const handleGuestLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSuccessMsg('⚡ Instant Access granted. Welcome to PredictPro!');
        onAuthSuccess(data.session);
      } else {
        throw new Error(data.message || 'Guest login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start instant session');
    } finally {
      setLoading(false);
    }
  };

  // Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate matching passwords
    if (regPassword !== regRepeatPassword) {
      setError('Passwords do not match. Please re-enter your repeat password.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          avatarUrl: regAvatarUrl,
          phone: regPhone,
          country: regCountry
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.userExists || (data.message && data.message.includes('already exists'))) {
          throw new Error('user already exists, sign in?');
        }
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMsg('Account created successfully! Welcome to PredictPro.');
      if (data.session) {
        onAuthSuccess(data.session);
      } else {
        setLoginEmail(regEmail.trim());
        setActiveTab('LOGIN');
      }
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  // 6-Digit OTP / Email Verification Confirm Handler
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationTargetEmail, code: verifyCode })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid or expired verification code.');
      }

      setSuccessMsg('Account successfully verified! Welcome to PredictPro.');
      if (data.session) {
        onAuthSuccess(data.session);
      } else {
        setLoginEmail(verificationTargetEmail);
        setActiveTab('LOGIN');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Verification Handler
  const handleResendVerificationEmail = async () => {
    if (!verificationTargetEmail) return;
    setError(null);
    setLoading(true);
    try {
      const result = await triggerFirebaseEmailVerification(verificationTargetEmail);
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationTargetEmail })
      });
      const data = await res.json();
      if (data.verificationCode) {
        setActiveOtpHint(data.verificationCode);
        setVerifyCode(data.verificationCode);
      }
      setSuccessMsg(`We have sent you a verification email to ${verificationTargetEmail}. verify it and login`);
    } catch (err: any) {
      setError('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Reset Link Trigger Handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const target = forgotEmail.trim();
    if (!target) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      await triggerFirebasePasswordReset(target);
      setResetSentTargetEmail(target);
      setSuccessMsg(`We sent you a password change link to ${target}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-neutral-950 font-sans overflow-hidden">
      {/* Dynamic Cinematic Football Superstar Stadium Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url('/images/football_bg.jpg')`
        }}
      />

      {/* Layered Vignette & Frosted Overlays for Crystal Clear Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/65 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-neutral-950/50 to-neutral-950" />

      {/* Centered Modern Glassmorphic Auth Container */}
      <div className="relative z-10 w-full max-w-[460px] my-6">
        <div className="bg-zinc-950/85 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Subtle Top Glowing Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

          {/* Logo & Brand Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center mb-2.5">
              <Logo />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              PREDICT PRO
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI FOOTBALL
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live Tactical Intelligence &amp; Verified Predictions
            </p>
          </div>

          {/* Clean Segmented Tab Switcher (Visible on Login & Register tabs) */}
          {(activeTab === 'LOGIN' || activeTab === 'REGISTER') && (
            <div className="flex bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800/90 mb-5 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('LOGIN');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'LOGIN'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('REGISTER');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'REGISTER'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div className="p-3 mb-4 text-xs bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('user already exists') && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('LOGIN');
                      setLoginEmail(regEmail);
                      setError(null);
                    }}
                    className="block mt-1 text-emerald-400 font-bold underline cursor-pointer"
                  >
                    Click here to Sign In
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div className="p-3 mb-4 text-xs bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SIGN IN                                                            */}
          {/* ========================================================================= */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setActiveTab('FORGOT_PASSWORD');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-900"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to PredictPro</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-zinc-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('REGISTER');
                      setError(null);
                    }}
                    className="text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CREATE ACCOUNT (WITH PHOTO, NAME, EMAIL, PASSWORD, REPEAT PASSWORD) */}
          {/* ========================================================================= */}
          {activeTab === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Profile Photo Upload Field */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
                <div className="relative">
                  {regAvatarUrl ? (
                    <img
                      src={regAvatarUrl}
                      alt="Profile Preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  {regAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setRegAvatarUrl('')}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full flex items-center justify-center text-white text-[10px]"
                      title="Remove Photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <span className="block text-xs font-semibold text-zinc-200">Profile Photo</span>
                  <span className="block text-[10px] text-zinc-400 mb-1.5">Upload personal avatar image</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{regAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Repeat Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Repeat Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showRepeatPassword ? 'text' : 'password'}
                    required
                    value={regRepeatPassword}
                    onChange={(e) => setRegRepeatPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showRepeatPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400">
                <span className="text-emerald-400 font-semibold">Verification Step:</span> We will send you an email verification link to activate your account.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Account & Verify Email'}
              </button>

              <div className="text-center pt-1">
                <p className="text-xs text-zinc-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('LOGIN');
                      setError(null);
                    }}
                    className="text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EMAIL VERIFICATION SCREEN                                          */}
          {/* ========================================================================= */}
          {activeTab === 'VERIFY' && (
            <div className="space-y-4 text-center animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <Mail className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">Verify Your Email Address</h3>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800">
                  We have sent you a verification email to{' '}
                  <span className="text-emerald-400 font-bold font-mono">{verificationTargetEmail}</span>.
                  Verify it and login.
                </p>
              </div>

              {/* Optional 6-digit OTP Input for immediate inline verification */}
              <form onSubmit={handleVerify} className="space-y-3 pt-1 text-left">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Or Enter 6-Digit Activation Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-center text-xl font-mono tracking-widest text-emerald-400 placeholder-zinc-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {activeOtpHint && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-emerald-300 text-[11px]">
                      DISPATCHED OTP: <strong className="font-mono">{activeOtpHint}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setVerifyCode(activeOtpHint)}
                      className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold"
                    >
                      Paste
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResendVerificationEmail}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                  >
                    Resend Email
                  </button>

                  <button
                    type="submit"
                    disabled={loading || verifyCode.length < 6}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Code'}
                  </button>
                </div>
              </form>

              {/* Primary Login Button taking user back to Sign In */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail(verificationTargetEmail);
                    setActiveTab('LOGIN');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: FORGOT PASSWORD SCREEN                                             */}
          {/* ========================================================================= */}
          {activeTab === 'FORGOT_PASSWORD' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-2">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Reset Your Password</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Enter your registered email address and we will dispatch a password reset link.
                </p>
              </div>

              {resetSentTargetEmail ? (
                <div className="space-y-4 text-center">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed">
                    We sent you a password change link to{' '}
                    <strong className="font-mono text-white">{resetSentTargetEmail}</strong>. Please check your inbox.
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail(resetSentTargetEmail);
                      setActiveTab('LOGIN');
                      setResetSentTargetEmail(null);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Get Reset Link</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('LOGIN');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-zinc-400 hover:text-emerald-400 cursor-pointer"
                    >
                      Remember your password? <span className="font-bold underline text-emerald-400">Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Minimalist Security Footer */}
          <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted &bull; Firebase Auth &bull; Sofascore AI PredictPro</span>
          </div>
        </div>
      </div>
    </div>
  );
};
