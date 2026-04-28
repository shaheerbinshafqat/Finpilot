import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { C } from '../theme.jsx';

export function Card({ children, className = '', pad = true, style = {} }) {
  return (
    <div
      className={`rounded-2xl ${pad ? 'p-5' : ''} ${className}`}
      style={{ background: C.card, boxShadow: 'var(--shadow-card)', ...style }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-6 flex-wrap">
      <div>
        <h2 className="font-display text-[32px] leading-[1] font-bold" style={{ color: C.ink }}>
          {children}
        </h2>
        {sub && <div className="text-[13px] mt-2" style={{ color: C.muted }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub, tone = 'neutral', icon, className = '' }) {
  const toneColor = { pos: C.pos, neg: C.neg, neutral: C.ink, accent: C.accent }[tone];
  return (
    <Card className={className}>
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] font-medium" style={{ color: C.muted }}>{label}</div>
        {icon}
      </div>
      <div
        className="font-display text-[26px] font-bold leading-none tracking-tight"
        style={{ color: toneColor }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] mt-2 font-medium" style={{ color: C.muted }}>{sub}</div>}
    </Card>
  );
}

export function Label({ children }) {
  return (
    <div className="text-[11px] font-medium mb-1.5" style={{ color: C.inkSoft }}>
      {children}
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <input
        {...props}
        className={`w-full rounded-xl px-3 py-2.5 text-[13px] focus:outline-none ${props.className || ''}`}
        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
        onFocus={e => { e.target.style.borderColor = C.accent; props.onFocus?.(e); }}
        onBlur={e => { e.target.style.borderColor = C.border; props.onBlur?.(e); }}
      />
    </label>
  );
}

export function Select({ label, options, ...props }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <select
        {...props}
        className={`w-full rounded-xl px-3 py-2.5 text-[13px] focus:outline-none cursor-pointer ${props.className || ''}`}
        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
      >
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </label>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <textarea
        {...props}
        className={`w-full rounded-xl px-3 py-2.5 text-[13px] focus:outline-none ${props.className || ''}`}
        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
      />
    </label>
  );
}

export function Button({ variant = 'primary', children, className = '', ...props }) {
  const styles = {
    primary: { background: C.accent, color: C.accentInk, border: 'none' },
    dark: { background: C.ink, color: C.bg, border: 'none' },
    ghost: { background: 'transparent', color: C.inkSoft, border: `1px solid ${C.border}` },
    light: { background: C.card, color: C.ink, border: `1px solid ${C.border}` },
    danger: { color: C.neg, border: `1px solid ${C.border}`, background: 'transparent' },
  }[variant];
  return (
    <button
      {...props}
      className={`px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${className}`}
      style={styles}
      onMouseEnter={e => {
        if (variant === 'primary') e.currentTarget.style.background = C.accentHover;
        else if (variant === 'ghost' || variant === 'light') e.currentTarget.style.background = C.hover;
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={e => {
        if (variant === 'primary') e.currentTarget.style.background = C.accent;
        else if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
        else if (variant === 'light') e.currentTarget.style.background = C.card;
        props.onMouseLeave?.(e);
      }}
    >
      {children}
    </button>
  );
}

export function Modal({ children, onClose, title, wide = false }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-6 overflow-y-auto"
      style={{ background: 'rgba(9,9,11,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className={`rounded-2xl w-full ${wide ? 'max-w-4xl' : 'max-w-md'} mt-12 p-6`}
        style={{ background: C.cardElev, boxShadow: 'var(--shadow-elev)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-[20px] font-bold" style={{ color: C.ink }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: C.muted }}
            onMouseEnter={e => { e.currentTarget.style.background = C.hover; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Pill({ children, tone = 'neutral' }) {
  const styles = {
    pos: { bg: C.posSoft, fg: C.pos },
    neg: { bg: C.negSoft, fg: C.neg },
    neutral: { bg: C.hover, fg: C.inkSoft },
    accent: { bg: C.accentSoft, fg: C.ink },
    info: { bg: C.infoSoft, fg: C.info },
    warn: { bg: C.warnSoft, fg: C.warn },
  }[tone];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: styles.bg, color: styles.fg }}
    >
      {children}
    </span>
  );
}

export function EmptyChart({ text, small = false }) {
  return (
    <div
      className={`h-full flex items-center justify-center ${small ? 'text-[11px]' : 'text-[12px]'}`}
      style={{ color: C.whisper }}
    >
      {text}
    </div>
  );
}

export function IconButton({ children, label, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
      style={{ background: C.card, color: C.inkSoft, border: `1px solid ${C.border}` }}
      onMouseEnter={e => { e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.ink; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.inkSoft; }}
    >
      {children}
    </button>
  );
}
