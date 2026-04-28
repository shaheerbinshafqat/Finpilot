import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { C } from '../theme.jsx';

export default function AuthModal({ mode = 'login', onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill out all fields.');
      return;
    }
    if (!isLogin && !name) {
      setError('Please enter your name.');
      return;
    }

    if (isLogin) {
      const stored = localStorage.getItem('auth_' + email);
      if (stored === password) {
        onAuth(email);
      } else {
        setError('Invalid email or password.');
      }
    } else {
      const stored = localStorage.getItem('auth_' + email);
      if (stored) {
        setError('Account already exists. Please sign in.');
      } else {
        localStorage.setItem('auth_' + email, password);
        if (name) localStorage.setItem('auth_name_' + email, name);
        onAuth(email);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 relative"
        style={{ background: C.cardElev, border: `1px solid ${C.border}`, boxShadow: 'var(--shadow-elev)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: C.muted }}
          onMouseEnter={e => e.currentTarget.style.background = C.hover}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: C.accent }}>
            {isLogin
              ? <LogIn className="w-5 h-5" style={{ color: C.accentInk }} />
              : <UserPlus className="w-5 h-5" style={{ color: C.accentInk }} />
            }
          </div>
          <h2 className="text-[22px] font-bold" style={{ color: C.ink }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>
            {isLogin ? 'Sign in to access your portfolio' : 'Start tracking your investments with FinPilot'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-[13px] font-medium"
            style={{ background: C.negSoft, color: C.neg, border: `1px solid ${C.neg}33` }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: C.inkSoft }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ahmed Khan"
                className="w-full rounded-xl px-4 py-3 text-[14px] focus:outline-none transition-colors"
                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
          )}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: C.inkSoft }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl px-4 py-3 text-[14px] focus:outline-none transition-colors"
              style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: C.inkSoft }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl px-4 py-3 text-[14px] focus:outline-none transition-colors"
              style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-all hover:opacity-90"
            style={{ background: C.accent, color: C.accentInk }}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6 text-[13px]" style={{ color: C.muted }}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="font-semibold hover:underline"
            style={{ color: C.accent }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
