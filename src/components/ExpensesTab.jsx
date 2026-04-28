import React, { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2 } from 'lucide-react';
import { C } from '../theme.jsx';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../constants.js';
import { fmtPKR } from '../lib/format.js';
import { Card, SectionTitle, Stat, Input, Select, Button, Pill } from './ui.jsx';

export default function ExpensesTab({ state, updater, showToast }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Food', description: '', amount: '', paymentMethod: 'Cash',
  });
  const [filter, setFilter] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  const filtered = [...state.expenses]
    .filter(e => !filter || (e.description || '').toLowerCase().includes(filter.toLowerCase()))
    .filter(e => catFilter === 'All' || e.category === catFilter)
    .filter(e => !monthFilter || e.date.startsWith(monthFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  const add = () => {
    if (!form.amount || !form.description) return showToast('Enter description and amount', 'error');
    updater.addExpense({ ...form, amount: Number(form.amount) });
    setForm({ ...form, description: '', amount: '' });
    showToast('Expense logged', 'success');
  };

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const catMap = {};
  filtered.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount); });
  const catArr = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const months = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const v = state.expenses.filter(e => e.date.startsWith(k)).reduce((s, e) => s + Number(e.amount), 0);
    months.push({ month: d.toLocaleDateString('en-PK', { month: 'short' }), amount: v });
  }

  return (
    <div>
      <SectionTitle sub="Log everything. Patterns emerge fast.">Expenses</SectionTitle>

      <Card className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>Quick add</div>
        <div className="grid grid-cols-6 gap-3">
          <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={EXPENSE_CATEGORIES} />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Uber to office" className="col-span-2" />
          <Input label="Amount (₨)" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <Select label="Method" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} options={PAYMENT_METHODS} />
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="dark" onClick={add}><Plus className="inline w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />Log expense</Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Stat label={`Total — ${monthFilter}`} value={fmtPKR(total)} sub={`${filtered.length} transactions`} tone="neg" />
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Top categories</div>
          <div className="space-y-1.5 max-h-[100px] overflow-y-auto scroll-thin">
            {catArr.length ? catArr.slice(0, 5).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-[12px]">
                <span style={{ color: C.inkSoft }}>{k}</span>
                <span className="font-mono font-semibold" style={{ color: C.ink }}>{fmtPKR(v)}</span>
              </div>
            )) : <div className="text-[11px]" style={{ color: C.whisper }}>No data</div>}
          </div>
        </Card>
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.muted }}>6-month trend</div>
          <div className="h-[100px]">
            <ResponsiveContainer>
              <BarChart data={months}>
                <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 10 }} stroke={C.border} />
                <Tooltip contentStyle={{ background: C.cardElev, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12 }} formatter={v => fmtPKR(v)} />
                <Bar dataKey="amount" fill="var(--chart5)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Input placeholder="Search description…" value={filter} onChange={e => setFilter(e.target.value)} className="max-w-[240px]" />
        <Select value={catFilter} onChange={e => setCatFilter(e.target.value)} options={['All', ...EXPENSE_CATEGORIES]} />
        <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="text-[13px]" style={{ color: C.whisper }}>Nothing matches.</div>
        </Card>
      ) : (
        <Card pad={false}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Date', 'Category', 'Description', 'Method', 'Amount', ''].map(h =>
                  <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${C.borderSoft}` }}
                  onMouseEnter={ev => ev.currentTarget.style.background = C.hover}
                  onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                  <td className="px-3 py-3 font-mono" style={{ color: C.inkSoft }}>{e.date}</td>
                  <td className="px-3 py-3"><Pill>{e.category}</Pill></td>
                  <td className="px-3 py-3" style={{ color: C.ink }}>{e.description}</td>
                  <td className="px-3 py-3" style={{ color: C.inkSoft }}>{e.paymentMethod}</td>
                  <td className="px-3 py-3 font-mono" style={{ color: C.neg, fontWeight: 600 }}>{fmtPKR(e.amount)}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => { if (confirm('Delete?')) updater.deleteExpense(e.id); }} style={{ color: C.muted }} className="hover:opacity-70">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
