import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { C } from '../theme.jsx';
import { computeHoldings } from '../lib/portfolio.js';
import { fmtPKR } from '../lib/format.js';
import { Card, SectionTitle, Stat, Input, Select, Button, Pill } from './ui.jsx';

export default function CashTab({ state, cash, updater, showToast }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'DEPOSIT', amount: '', note: '',
  });

  const add = () => {
    if (!form.amount) return showToast('Enter amount', 'error');
    updater.addCash({ ...form, amount: Number(form.amount) });
    setForm({ ...form, amount: '', note: '' });
    showToast(`${form.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} recorded`, 'success');
  };

  const portfolioValue = computeHoldings(state.transactions, state.prices, state.settings.costBasisMethod)
    .reduce((s, h) => s + h.currentValue, 0);
  const total = cash + portfolioValue;
  const investedRatio = total > 0 ? (portfolioValue / total) * 100 : 0;
  const moves = [...state.cashMoves].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <SectionTitle sub="Dry powder, deployment, liquidity.">Cash Flow</SectionTitle>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Stat label="Available cash" value={fmtPKR(cash)} tone={cash > 0 ? 'accent' : 'neg'} />
        <Stat label="Deployed" value={fmtPKR(portfolioValue)} sub={`${investedRatio.toFixed(0)}% of capital`} />
        <Stat label="Total capital" value={fmtPKR(total)} />
        <Stat label="Buying power" value={fmtPKR(Math.max(0, cash))}
          sub={cash > 0 ? 'Ready to deploy' : 'Need to deposit'}
          tone={cash > 0 ? 'pos' : 'neg'} />
      </div>

      <Card className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
          Record cash movement
        </div>
        <div className="grid grid-cols-5 gap-3">
          <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
            options={[
              { value: 'DEPOSIT', label: 'Deposit (in)' },
              { value: 'WITHDRAW', label: 'Withdraw (out)' },
            ]} />
          <Input label="Amount (₨)" type="number" step="0.01" value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })} />
          <Input label="Note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
            placeholder="Salary, broker top-up…" />
          <div className="flex items-end">
            <Button variant="dark" onClick={add} className="w-full">Record</Button>
          </div>
        </div>
      </Card>

      {moves.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="text-[13px]" style={{ color: C.whisper }}>No cash movements yet.</div>
        </Card>
      ) : (
        <Card pad={false}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Date', 'Type', 'Amount', 'Note', ''].map(h =>
                  <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {moves.map(m => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <td className="px-3 py-3 font-mono" style={{ color: C.inkSoft }}>{m.date}</td>
                  <td className="px-3 py-3"><Pill tone={m.type === 'DEPOSIT' ? 'pos' : 'neg'}>{m.type}</Pill></td>
                  <td className="px-3 py-3 font-mono font-semibold" style={{ color: m.type === 'DEPOSIT' ? C.pos : C.neg }}>
                    {m.type === 'DEPOSIT' ? '+' : '-'}{fmtPKR(m.amount)}
                  </td>
                  <td className="px-3 py-3" style={{ color: C.inkSoft }}>{m.note}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => updater.deleteCash(m.id)} style={{ color: C.muted }} className="hover:opacity-70">
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
