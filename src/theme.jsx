import React, { createContext, useContext } from 'react';

export const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

// FinPilot design tokens — all CSS variables, instant theme swap
export const C = {
  bg: 'var(--bg)',
  card: 'var(--card)',
  cardElev: 'var(--cardElev)',
  hover: 'var(--hover)',
  ink: 'var(--ink)',
  inkSoft: 'var(--inkSoft)',
  muted: 'var(--muted)',
  whisper: 'var(--whisper)',
  border: 'var(--border)',
  borderSoft: 'var(--borderSoft)',
  accent: 'var(--accent)',
  accentHover: 'var(--accentHover)',
  accentInk: 'var(--accentInk)',
  accentSoft: 'var(--accentSoft)',
  pos: 'var(--pos)',
  posSoft: 'var(--posSoft)',
  neg: 'var(--neg)',
  negSoft: 'var(--negSoft)',
  info: 'var(--info)',
  infoSoft: 'var(--infoSoft)',
  warn: 'var(--warn)',
  warnSoft: 'var(--warnSoft)',
};

export const CHART_COLORS = [
  'var(--chart1)', 'var(--chart2)', 'var(--chart3)', 'var(--chart4)',
  'var(--chart5)', 'var(--chart6)', 'var(--chart7)', 'var(--chart8)',
];

export function ThemeStyles() {
  return (
    <style>{`
      :root[data-theme="dark"] {
        --bg: #0a0a0f; --card: #12121a; --cardElev: #1a1a25; --hover: #1e1e2a;
        --ink: #f0f0f5; --inkSoft: #b8b8cc; --muted: #6e6e82; --whisper: #3d3d4e;
        --border: #1e1e2a; --borderSoft: #16161f;
        --accent: #6366f1; --accentHover: #818cf8; --accentInk: #ffffff; --accentSoft: rgba(99,102,241,0.12);
        --pos: #34d399; --posSoft: rgba(52,211,153,0.1);
        --neg: #f87171; --negSoft: rgba(248,113,113,0.1);
        --info: #60a5fa; --infoSoft: rgba(96,165,250,0.1);
        --warn: #fbbf24; --warnSoft: rgba(251,191,36,0.1);
        --chart1: #6366f1; --chart2: #34d399; --chart3: #60a5fa; --chart4: #fbbf24;
        --chart5: #f87171; --chart6: #a78bfa; --chart7: #38bdf8; --chart8: #f472b6;
        --shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03);
        --shadow-elev: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
      }
      :root[data-theme="light"] {
        --bg: #f8f9fc; --card: #ffffff; --cardElev: #ffffff; --hover: #f1f3f9;
        --ink: #0f172a; --inkSoft: #334155; --muted: #64748b; --whisper: #94a3b8;
        --border: #e2e8f0; --borderSoft: #f1f5f9;
        --accent: #6366f1; --accentHover: #4f46e5; --accentInk: #ffffff; --accentSoft: rgba(99,102,241,0.08);
        --pos: #10b981; --posSoft: #d1fae5;
        --neg: #ef4444; --negSoft: #fee2e2;
        --info: #3b82f6; --infoSoft: #dbeafe;
        --warn: #f59e0b; --warnSoft: #fef3c7;
        --chart1: #6366f1; --chart2: #10b981; --chart3: #3b82f6; --chart4: #f59e0b;
        --chart5: #ef4444; --chart6: #8b5cf6; --chart7: #0ea5e9; --chart8: #ec4899;
        --shadow-card: 0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.03);
        --shadow-elev: 0 12px 40px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04);
      }
      body, html { background: var(--bg); }
      * { transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease; }
      .scroll-thin::-webkit-scrollbar { width: 5px; height: 5px; }
      .scroll-thin::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      .scroll-thin::-webkit-scrollbar-track { background: transparent; }
      .font-display { font-family: 'Inter', system-ui, -apple-system, sans-serif; letter-spacing: -0.025em; }
      .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-feature-settings: 'zero'; }
      @keyframes pulseAccent { 0%,100%{box-shadow:0 0 0 0 var(--accent)} 50%{box-shadow:0 0 0 6px transparent} }
      @keyframes pulsePos { 0%,100%{box-shadow:0 0 0 0 var(--pos)} 50%{box-shadow:0 0 0 6px transparent} }
      @keyframes slideInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      .live-dot { animation: pulsePos 2s infinite; }
      input, select, textarea { color-scheme: light dark; }
      input::placeholder, textarea::placeholder { color: var(--muted); opacity: 0.7; }
      select option { background: var(--card); color: var(--ink); }
      button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      ::selection { background: var(--accentSoft); color: var(--ink); }
    `}</style>
  );
}

export function FontLink() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
    />
  );
}
