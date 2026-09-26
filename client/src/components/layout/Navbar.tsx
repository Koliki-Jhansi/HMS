import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Activity,
  LogOut,
  User as UserIcon,
  ChevronDown,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Badge } from '../common/Badge';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-slate-950/40 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 flex items-center justify-between text-white select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-sky-200 to-teal-200 bg-clip-text text-transparent">
              HIRO HOSPITAL
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider block text-sky-400 -mt-0.5">
              Digital Care Suite
            </span>
          </div>
        </Link>

        {/* Live status badge */}
        <div className="hidden sm:flex items-center gap-2 ml-4 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>3D Hospital Engine Live</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-2xl shadow-2xl border border-white/15 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 text-white">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link) navigate(n.link);
                          setShowNotifs(false);
                        }}
                        className={`p-3.5 hover:bg-white/5 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-sky-500/10' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white">{n.title}</span>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1.5 block">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User profile dropdown */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
            >
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=0284c7&color=fff&bold=true`
                }
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-sky-400/40"
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                  {user.name}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-[10px] text-sky-400 font-medium">{user.role}</div>
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-2xl shadow-2xl border border-white/15 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 p-1.5 text-white">
                <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <div className="mt-1.5">
                    <Badge status={user.role} size="sm" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    to={
                      user.role === 'ADMIN'
                        ? '/admin'
                        : user.role === 'DOCTOR'
                        ? '/doctor'
                        : '/patient'
                    }
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-sky-400" />
                    My Portal Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
