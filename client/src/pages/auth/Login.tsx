import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  HeartPulse,
} from 'lucide-react';
import { HospitalWalkthroughScene, WalkthroughPhase, UserHospitalRole } from '../../components/3d/HospitalWalkthroughScene';
import { useIsMobile } from '../../components/3d/useIsMobile';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 3D Scene State Machine: EXTERIOR_IDLE -> WALKING_IN -> LOBBY_IDLE
  const [scenePhase, setScenePhase] = useState<WalkthroughPhase>('EXTERIOR_IDLE');
  const [targetDashboard, setTargetDashboard] = useState<string>('/patient');
  const [authRole, setAuthRole] = useState<UserHospitalRole>('PATIENT');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Call REAL backend login API
      await login(email, password);

      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const role: UserHospitalRole =
        savedUser.role === 'ADMIN'
          ? 'ADMIN'
          : savedUser.role === 'DOCTOR'
          ? 'DOCTOR'
          : 'PATIENT';

      const targetRoute =
        role === 'ADMIN'
          ? '/admin'
          : role === 'DOCTOR'
          ? '/doctor'
          : '/patient';

      setAuthRole(role);
      setTargetDashboard(targetRoute);

      if (shouldReduceMotion) {
        navigate(targetRoute, { replace: true });
        return;
      }

      // 2. REAL LOGIN SUCCESS: Trigger 3D Camera forward movement through doors into lobby & role wing!
      setScenePhase('WALKING_IN');
    } catch (err: any) {
      // INVALID LOGIN: Stay outside 3D hospital, show error, DO NOT move camera
      setError(err.response?.data?.message || err.message || 'Invalid email or password credentials');
      setLoading(false);
    }
  };

  const handleArrivedAtLobby = () => {
    // 3D Camera has entered specific role wing -> smoothly reveal dashboard!
    navigate(targetDashboard, { replace: true });
  };

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-slate-950 text-white flex flex-col justify-between select-none">
      {/* =========================================================================
          1. REAL 3D HOSPITAL CANVAS (Exterior -> Walkway -> Doors Open -> Role Wing)
         ========================================================================= */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Canvas
          camera={{ position: [0, 2.2, 18.0], fov: 48 }}
          dpr={isMobile ? [1, 1] : [1, 1.5]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <HospitalWalkthroughScene
            phase={scenePhase}
            targetRole={authRole}
            onArrivedAtLobby={handleArrivedAtLobby}
          />
        </Canvas>

        {/* Ambient Dark/Cyan Readability Vignette */}
        <div className="absolute inset-0 bg-slate-950/40 z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-slate-950/75 z-[2] pointer-events-none" />
      </div>

      {/* Top Header Bar */}
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-200 bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            3D Hospital Engine Active
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. TWO-COLUMN LOGIN UI (DIRECTLY OVER 3D SCENE - NO BIG CARD)
         ========================================================================= */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-6 sm:px-12 lg:px-20 py-8 flex items-center pointer-events-auto">
        <AnimatePresence>
          {scenePhase === 'EXTERIOR_IDLE' && (
            <motion.div
              key="login-form-container"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.4 } }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
            >
              {/* ================= LEFT COLUMN: HIRO HOSPITAL HERO ================= */}
              <div className="lg:col-span-6 flex flex-col justify-center text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs sm:text-sm font-semibold backdrop-blur-md mb-5 self-start shadow-inner">
                  <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                  <span>Hospital Management System</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-5 drop-shadow-md">
                  Smart Healthcare. <br />
                  <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    Connected Care.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-200 font-normal mb-8 max-w-lg leading-relaxed drop-shadow">
                  Manage patients, doctors, appointments and hospital operations from one intelligent 3D platform.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md">
                    <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">Authorized Staff Access</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/40 border border-white/10 backdrop-blur-md">
                    <HeartPulse className="w-5 h-5 text-teal-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">Real-Time Hospital Ops</span>
                  </div>
                </div>
              </div>

              {/* ================= RIGHT COLUMN: TRANSPARENT GLASS LOGIN FORM ================= */}
              <div className="lg:col-span-6 max-w-md w-full mx-auto lg:ml-auto flex flex-col justify-center text-left">
                <div className="mb-6">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-slate-300 mt-1 font-medium">
                    Hospital Staff & Patient Portal
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                      Email / Staff ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
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
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-white/20 rounded-xl text-sm text-white placeholder-slate-400 backdrop-blur-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-sky-600 rounded border-slate-700 bg-slate-900 focus:ring-sky-500"
                      />
                      <span>Remember Me</span>
                    </label>
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Please contact hospital administration to reset staff or patient credentials.');
                      }}
                      className="font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                    >
                      Forgot Password?
                    </a>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ y: -2, boxShadow: '0 0 25px rgba(56, 189, 248, 0.45)' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white font-bold text-sm sm:text-base rounded-xl shadow-xl shadow-sky-500/25 border border-sky-300/40 flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-70 cursor-pointer mt-3"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </form>

                {/* Register Link */}
                <div className="mt-6 flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                  <span>Don't have an account?</span>
                  <Link
                    to="/register"
                    className="font-bold text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 transition-colors"
                  >
                    Register →
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= 3D ENTRANCE WALKTHROUGH STATUS BANNER ================= */}
        <AnimatePresence>
          {scenePhase === 'WALKING_IN' && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
            >
              <div className="inline-flex items-center gap-3.5 px-7 py-3.5 rounded-full bg-slate-900/90 border border-sky-400/50 text-sky-300 text-base font-semibold backdrop-blur-xl shadow-2xl">
                <span className="w-3 h-3 rounded-full bg-sky-400 animate-ping" />
                <span>Entering HIRO Hospital • Doors Opening...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Bottom Line */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-400 pointer-events-none">
        © 2026 HIRO HOSPITAL Management System • Real-Time 3D Digital Architecture
      </footer>
    </div>
  );
};

export default Login;
