import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HeartPulse,
  MessageSquareHeart,
  FileText,
  ScanEye,
  MapPin,
  Shield,
  Info,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  LogIn,
  LogOut,
  Stethoscope,
  Pill,
  History as HistoryIcon,
  UserCircle,
  Siren,
  Contact as ContactIcon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading: authLoading, logout } = useAuth();

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: HeartPulse },
    { name: 'AI Chat', path: '/chat', icon: MessageSquareHeart },
    { name: 'Medical Reports', path: '/reports', icon: FileText },
    { name: 'Image Analysis', path: '/image-analysis', icon: ScanEye },
    { name: 'Nearby Hospitals', path: '/hospitals', icon: MapPin },
    { name: 'Emergency', path: '/emergency', icon: Siren },
    { name: 'Contact', path: '/contact', icon: ContactIcon },
    { name: 'Symptom Checker', path: '/symptom-checker', icon: Stethoscope },
    { name: 'Medicine', path: '/medicine', icon: Pill },
    { name: 'Privacy & Safety', path: '/privacy', icon: Shield },
    { name: 'About', path: '/about', icon: Info },
  ];
  const authenticatedLinks = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: HeartPulse },
    { name: 'History', path: '/history', icon: HistoryIcon },
    { name: 'Profile', path: '/profile', icon: UserCircle },
    ...(user.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
  ] : [];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-medical-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-medical-500/20 group-hover:scale-105 transition-transform duration-200">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-medical-700 to-teal-600 dark:from-white dark:via-medical-400 dark:to-teal-300 bg-clip-text text-transparent">
                  MediGuide
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-medical-100 text-medical-800 dark:bg-medical-950 dark:text-medical-300 border border-medical-200 dark:border-medical-800">
                  AI 2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block leading-none">
                Responsible Clinical Guidance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[...navLinks, ...authenticatedLinks].map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-medical-50 text-medical-700 dark:bg-medical-950/70 dark:text-medical-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-medical-600 dark:hover:text-medical-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-medical-600 dark:text-medical-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Theme Toggle */}
          <div className="flex items-center gap-2">
            <Link
              to="/chat"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-medical-600 hover:bg-medical-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-all duration-150 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Doctor</span>
            </Link>

            {!authLoading && (user ? (
              <>
                <span className="hidden xl:inline text-xs text-slate-500 dark:text-slate-400">{user.full_name}</span>
                <button
                  onClick={() => {
                    void logout().then(() => window.location.assign('/'));
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span>Register</span>
                </Link>
              </>
            ))}

            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active
                    ? 'bg-medical-50 text-medical-700 dark:bg-medical-950 dark:text-medical-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-medical-600' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <HeartPulse className="w-5 h-5 text-slate-400" />
                Dashboard
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <HistoryIcon className="w-5 h-5 text-slate-400" />
                History
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <UserCircle className="w-5 h-5 text-slate-400" />
                Profile
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <Shield className="w-5 h-5 text-slate-400" />
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  void logout().then(() => window.location.assign('/'));
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <LogOut className="w-5 h-5 text-slate-400" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <LogIn className="w-5 h-5 text-slate-400" />
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <LogIn className="w-5 h-5 text-slate-400" />
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
