import React from 'react';
import {
  LayoutDashboard, Briefcase, Receipt, Wallet, BookOpen, TrendingUp, BarChart3, Calculator,
  Bell, Settings as SettingsIcon, DollarSign, Lightbulb, History, FileText, GitCompare, LogOut,
} from 'lucide-react';
import { C } from '../theme.jsx';

const SECTIONS = [
  { items: [{ id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard }] },
  { label: 'Invest', items: [
    { id: 'portfolio', label: 'Portfolio', Icon: Briefcase },
    { id: 'transactions', label: 'Transactions', Icon: Receipt },
    { id: 'stocks', label: 'Stocks', Icon: BarChart3 },
    { id: 'insights', label: 'Insights', Icon: Lightbulb },
  ]},
  { label: 'Money', items: [
    { id: 'expenses', label: 'Expenses', Icon: Wallet },
    { id: 'cash', label: 'Cash Flow', Icon: DollarSign },
  ]},
  { label: 'Tools', items: [
    { id: 'calculators', label: 'Calculators', Icon: Calculator },
    { id: 'analytics', label: 'Analytics', Icon: TrendingUp },
    { id: 'alerts', label: 'Alerts', Icon: Bell },
    { id: 'journal', label: 'Journal', Icon: BookOpen },
  ]},
  { label: 'Admin', items: [
    { id: 'audit', label: 'Audit Log', Icon: History },
    { id: 'tax', label: 'Tax Report', Icon: FileText },
    { id: 'reconcile', label: 'Reconcile', Icon: GitCompare },
    { id: 'settings', label: 'Settings', Icon: SettingsIcon },
  ]},
];

export default function Sidebar({ tab, setTab, onSignOut }) {
  return (
    <aside
      className="w-[240px] flex flex-col shrink-0 sticky top-0 h-screen py-6"
      style={{ background: C.card, borderRight: `1px solid ${C.border}` }}
    >
      {/* Branding */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: C.accent }}
        >
          <span className="text-[16px] font-black" style={{ color: C.accentInk }}>F</span>
        </div>
        <div>
          <div className="text-[16px] font-bold tracking-tight" style={{ color: C.ink }}>
            FinPilot
          </div>
          <div
            className="text-[9px] font-medium tracking-wider uppercase"
            style={{ color: C.muted }}
          >
            Intelligence
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scroll-thin">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className={idx > 0 ? 'pt-4' : ''}>
            {section.label && (
              <div
                className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2"
                style={{ color: C.whisper }}
              >
                {section.label}
              </div>
            )}
            {section.items.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all font-medium"
                  style={{
                    background: active ? C.accentSoft : 'transparent',
                    color: active ? C.accent : C.inkSoft,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.hover; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 1.6} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="px-4 pt-4 mt-auto" style={{ borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
          style={{ color: C.muted }}
          onMouseEnter={e => { e.currentTarget.style.background = C.negSoft; e.currentTarget.style.color = C.neg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
