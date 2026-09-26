import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  HeartPulse,
  Sparkles,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { HospitalAuthBackground } from '../../components/background/HospitalAuthBackground';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'PATIENT',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Confirm Password
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        role: formData.role as 'PATIENT' | 'DOCTOR' | 'ADMIN',
      });

      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (savedUser.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (savedUser.role === 'DOCTOR') navigate('/doctor', { replace: true });
      else navigate('/patient', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-slate-950 text-white flex flex-col justify-between select-none">
      {/* =========================================================================
          1. FULL-SCREEN ANIMATED HOSPITAL LOBBY BACKGROUND + PARALLAX + PETAL BLOOMS
         ========================================================================= */}
      <HospitalAuthBackground image="/images/hiro/lobby.jpg" />

      {/* Top Brand Header Bar */}
      <header className="relative z-20 px-6 py-6 sm:px-12 lg:px-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 backdrop-blur-md flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-white font-extrabold tracking-wider text-base sm:text-lg flex items-center gap-2">
              HIRO HOSPITAL
              <span className="text-sky-300 font-semibold text-[11px] px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-700/60">
                DIGITAL HMS
              </span>
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-sky-300 hover:text-white border border-slate-700/70 text-xs font-semibold backdrop-blur-md transition-all shadow-md cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Hospital Exterior</span>
        </Link>
      </header>

      {/* =========================================================================
          2. TWO-COLUMN MAIN CONTENT (DIRECTLY OVER HOSPITAL BACKGROUND - NO BIG CARD)
         ========================================================================= */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 lg:px-20 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center pointer-events-auto">
        {/* ================= LEFT COLUMN: HERO & FEATURES ================= */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:col-span-6 flex flex-col justify-center text-left"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs sm:text-sm font-semibold backdrop-blur-md mb-5 self-start shadow-inner">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Hospital Management System</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-5 drop-shadow-md">
            Create Your <br />
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Account
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 font-normal mb-8 max-w-lg leading-relaxed drop-shadow">
            Join HIRO Hospital and be part of our journey towards smarter operations and better healthcare.
          </p>

          {/* Feature Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Feature 1 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md transition-all hover:bg-slate-900/60">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Secure Access</h4>
                <p className="text-xs text-slate-300 mt-0.5">Role-based permissions & audit</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md transition-all hover:bg-slate-900/60">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-400/30 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Modern System</h4>
                <p className="text-xs text-slate-300 mt-0.5">Manage hospital operations live</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md transition-all hover:bg-slate-900/60">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Better Healthcare</h4>
                <p className="text-xs text-slate-300 mt-0.5">Together for healthier lives</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md transition-all hover:bg-slate-900/60">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Trusted Platform</h4>
                <p className="text-xs text-slate-300 mt-0.5">Built for medical specialists</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= RIGHT COLUMN: DIRECT REGISTRATION FORM ================= */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="lg:col-span-6 flex flex-col justify-center text-left"
        >
          {/* Header Title */}
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Register
            </h2>
            <p className="text-sm text-slate-300 mt-1 font-medium">
              Fill in your details to create your account
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 backdrop-blur-md flex items-start gap-2.5 text-xs text-rose-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form with Transparent Glass Input Fields (No large bounding card) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone / Staff ID */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Staff ID / Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Select Role */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Select Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/20 rounded-xl text-sm text-white backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all duration-200"
                >
                  <option value="PATIENT" className="bg-slate-900 text-white">Patient (Default Portal)</option>
                  <option value="DOCTOR" className="bg-slate-900 text-white">Doctor / Physician</option>
                  <option value="ADMIN" className="bg-slate-900 text-white">Hospital Administrator</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Register Action Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ y: -2, boxShadow: '0 0 25px rgba(56, 189, 248, 0.45)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white font-bold text-sm sm:text-base rounded-xl shadow-xl shadow-sky-500/25 border border-sky-300/40 flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-70 cursor-pointer mt-4"
            >
              {loading ? 'Creating Medical Account...' : 'Register'}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>

          {/* Footer Navigation Link back to Login */}
          <div className="mt-6 flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <span>Already have an account?</span>
            <Link
              to="/login"
              className="font-bold text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 transition-colors"
            >
              Sign In →
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer Bottom Line */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-400 pointer-events-none">
        © 2026 HIRO HOSPITAL Management System • Advanced Healthcare Architecture
      </footer>
    </div>
  );
};

export default Register;
