import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Check,
} from 'lucide-react';

const HIRO_IMAGES = {
  exterior: '/images/hiro/exterior.jpg',
  entrance: '/images/hiro/entrance.jpg',
  doors: '/images/hiro/doors.jpg',
  lobby: '/images/hiro/lobby.jpg',
};

type WalkthroughStage = 'EXTERIOR_IDLE' | 'STEP_EXTERIOR' | 'STEP_ENTRANCE' | 'STEP_DOORS' | 'LOBBY_IDLE';

export const LandingWelcome: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const isDirectLogin = location.pathname === '/login';
  const [stage, setStage] = useState<WalkthroughStage>(isDirectLogin ? 'LOBBY_IDLE' : 'EXTERIOR_IDLE');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Preload all 4 HIRO visuals on initial mount
  useEffect(() => {
    Object.values(HIRO_IMAGES).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (location.pathname === '/login') {
      setStage('LOBBY_IDLE');
    }
  }, [location.pathname]);

  // Cinematic 4-Stage Walkthrough Controller
  const startWalkthrough = () => {
    if (shouldReduceMotion) {
      setStage('LOBBY_IDLE');
      return;
    }

    setStage('STEP_EXTERIOR');

    // Stage 1: Push through exterior (1.2s)
    setTimeout(() => {
      setStage('STEP_ENTRANCE');
    }, 1200);

    // Stage 2: Approach entrance & portico (1.2s)
    setTimeout(() => {
      setStage('STEP_DOORS');
    }, 2400);

    // Stage 3: Cross through glass sliding doors into Lobby (1.2s)
    setTimeout(() => {
      setStage('LOBBY_IDLE');
    }, 3800);
  };

  const handleResetToExterior = () => {
    setStage('EXTERIOR_IDLE');
    setError(null);
  };

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (savedUser.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (savedUser.role === 'DOCTOR') navigate('/doctor', { replace: true });
      else navigate('/patient', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* =========================================================================
          CINEMATIC MULTI-STAGE HOSPITAL BACKGROUND LAYER
         ========================================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatePresence mode="wait">
          {/* 1. EXTERIOR SCENE (Idle or initial push) */}
          {(stage === 'EXTERIOR_IDLE' || stage === 'STEP_EXTERIOR') && (
            <motion.div
              key="scene-exterior"
              className="absolute -inset-[6%] w-[112%] h-[112%] bg-cover bg-center"
              style={{
                backgroundImage: `url(${HIRO_IMAGES.exterior})`,
                willChange: 'transform, filter',
              }}
              initial={{ scale: 1.0, x: 0, y: 0, filter: 'blur(0px)' }}
              animate={
                stage === 'STEP_EXTERIOR'
                  ? {
                      scale: 1.18,
                      x: [0, -10],
                      y: [0, -15],
                      filter: 'blur(1.5px)',
                      transition: { duration: 1.25, ease: [0.4, 0, 0.2, 1] },
                    }
                  : shouldReduceMotion
                  ? { scale: 1.0 }
                  : {
                      scale: [1.0, 1.045, 1.0],
                      x: [0, 12, -10, 0],
                      y: [0, -8, 6, 0],
                      transition: {
                        duration: 22,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        repeatType: 'reverse',
                      },
                    }
              }
              exit={{ opacity: 0, scale: 1.22, filter: 'blur(3px)', transition: { duration: 0.5 } }}
            />
          )}

          {/* 2. ENTRANCE APPROACH SCENE */}
          {stage === 'STEP_ENTRANCE' && (
            <motion.div
              key="scene-entrance"
              className="absolute -inset-[6%] w-[112%] h-[112%] bg-cover bg-center"
              style={{
                backgroundImage: `url(${HIRO_IMAGES.entrance})`,
                willChange: 'transform, filter',
              }}
              initial={{ opacity: 0, scale: 1.02, filter: 'blur(2px)' }}
              animate={{
                opacity: 1,
                scale: 1.2,
                x: [0, -8],
                y: [0, -12],
                filter: 'blur(1.2px)',
                transition: { duration: 1.25, ease: [0.4, 0, 0.2, 1] },
              }}
              exit={{ opacity: 0, scale: 1.25, filter: 'blur(3px)', transition: { duration: 0.5 } }}
            />
          )}

          {/* 3. GLASS SLIDING DOORS THRESHOLD SCENE */}
          {stage === 'STEP_DOORS' && (
            <motion.div
              key="scene-doors"
              className="absolute -inset-[6%] w-[112%] h-[112%] bg-cover bg-center"
              style={{
                backgroundImage: `url(${HIRO_IMAGES.doors})`,
                willChange: 'transform, filter',
              }}
              initial={{ opacity: 0, scale: 1.04, filter: 'blur(2px)' }}
              animate={{
                opacity: 1,
                scale: 1.26,
                x: 0,
                y: -10,
                filter: 'blur(1.0px)',
                transition: { duration: 1.35, ease: [0.4, 0, 0.2, 1] },
              }}
              exit={{ opacity: 0, scale: 1.3, filter: 'blur(4px)', transition: { duration: 0.6 } }}
            />
          )}

          {/* 4. HOSPITAL LOBBY & RECEPTION SCENE (Login Background) */}
          {stage === 'LOBBY_IDLE' && (
            <motion.div
              key="scene-lobby"
              className="absolute -inset-[6%] w-[112%] h-[112%] bg-cover bg-center"
              style={{
                backgroundImage: `url(${HIRO_IMAGES.lobby})`,
                willChange: 'transform',
              }}
              initial={{ opacity: 0, scale: 1.08, filter: 'blur(2px)' }}
              animate={
                shouldReduceMotion
                  ? { opacity: 1, scale: 1.03, filter: 'blur(0px)' }
                  : {
                      opacity: 1,
                      filter: 'blur(0px)',
                      scale: [1.03, 1.065, 1.03],
                      x: [0, 10, -8, 0],
                      y: [0, -6, 5, 0],
                      transition: {
                        opacity: { duration: 0.8 },
                        filter: { duration: 0.8 },
                        scale: { duration: 18, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                        x: { duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                        y: { duration: 16, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                      },
                    }
              }
            />
          )}
        </AnimatePresence>

        {/* Global Atmosphere & Dark/Blue Tone Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-slate-950/70 z-[2]" />
      </div>

      {/* =========================================================================
          TOP BRANDING NAVIGATION BAR
         ========================================================================= */}
      <div className="absolute top-0 left-0 right-0 z-30 px-6 py-6 sm:px-12 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/25 border border-sky-400/40 backdrop-blur-md flex items-center justify-center text-sky-300 shadow-lg shadow-sky-500/20">
            <Building2 className="w-6 h-6" />
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

        <div className="flex items-center gap-3">
          {stage === 'LOBBY_IDLE' && (
            <button
              onClick={handleResetToExterior}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-sky-300 hover:text-white border border-slate-700/70 text-xs font-semibold backdrop-blur-md transition-all shadow-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hospital Exterior</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-200 bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Hospital Systems Active
          </div>
        </div>
      </div>

      {/* =========================================================================
          STAGE 1: OPENING PAGE (LEFT-ALIGNED HIRO HOSPITAL HERO CONTENT)
         ========================================================================= */}
      <AnimatePresence>
        {stage === 'EXTERIOR_IDLE' && (
          <motion.div
            key="exterior-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 z-20 flex items-center px-6 sm:px-16 lg:px-24 pointer-events-auto"
          >
            <div className="max-w-2xl text-left">
              {/* Top Subhead */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs sm:text-sm font-semibold backdrop-blur-md mb-6 shadow-inner"
              >
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>HIRO HOSPITAL • Hospital Management System</span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] mb-6 drop-shadow-lg">
                Advanced <br />
                <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Healthcare
                </span> <br />
                Management
              </h1>

              {/* Mission Statement */}
              <p className="text-base sm:text-xl text-slate-200 font-normal mb-8 max-w-xl leading-relaxed drop-shadow">
                Innovative Care. Smarter Operations. Healthier Communities.
              </p>

              {/* CTA Action Button */}
              <motion.button
                onClick={startWalkthrough}
                whileHover={{ scale: 1.04, boxShadow: '0 0 35px rgba(56, 189, 248, 0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-white font-bold text-lg shadow-xl shadow-sky-500/25 border border-sky-300/40 hover:from-sky-400 hover:to-teal-400 transition-all duration-300 cursor-pointer"
              >
                <span>Enter Hospital</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          STAGE 2: CINEMATIC WALKTHROUGH STATUS INDICATOR
         ========================================================================= */}
      <AnimatePresence>
        {(stage === 'STEP_EXTERIOR' || stage === 'STEP_ENTRANCE' || stage === 'STEP_DOORS') && (
          <motion.div
            key="transit-banner"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-10 inset-x-0 z-20 flex justify-center pointer-events-none"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900/90 border border-sky-500/50 text-sky-300 text-sm font-semibold backdrop-blur-xl shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
              <span>
                {stage === 'STEP_EXTERIOR' && 'Approaching Hospital Entrance...'}
                {stage === 'STEP_ENTRANCE' && 'Approaching Glass Portico...'}
                {stage === 'STEP_DOORS' && 'Passing Through Automatic Doors...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          STAGE 3: LOBBY ARRIVAL — HIRO HOSPITAL LOGIN CARD
         ========================================================================= */}
      <AnimatePresence>
        {stage === 'LOBBY_IDLE' && (
          <motion.div
            key="login-panel-container"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-auto"
          >
            {/* Centered Glass Login Panel (width ~440px, p: 36px, rounded: 22px) */}
            <div
              className="w-full max-w-[440px] bg-slate-950/70 backdrop-blur-2xl shadow-2xl p-8 sm:p-9 border border-white/20 overflow-hidden"
              style={{ borderRadius: '22px' }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-sky-500/30 mb-3">
                  <Activity className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  HIRO HOSPITAL
                </h2>
                <p className="text-xs text-sky-400 font-bold uppercase tracking-wider mt-0.5">
                  Hospital Management System
                </p>
                <div className="mt-2 pt-2 border-t border-white/10 text-xs text-slate-300 font-medium">
                  Welcome Back • Sign in to continue
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmitLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email / Staff ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/15 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs text-slate-300 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-white/20 bg-slate-900/60 focus:ring-sky-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Please contact hospital administration to reset staff or patient credentials.');
                    }}
                    className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer mt-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
                Need a patient account?{' '}
                <Link to="/register" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
                  Register as New Patient
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingWelcome;
