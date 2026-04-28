import React, { useState } from 'react';
import { Plus, FileSpreadsheet, Trash2 } from 'lucide-react';
import { C } from '../theme.jsx';
import { fmtPKR, fmtNum } from '../lib/format.js';
import { Card, SectionTitle, Input, Select, Button, Modal, Pill } from './ui.jsx';
import TransactionForm from './TransactionForm.jsx';
import CSVImport from './CSVImport.jsx';

export default function TransactionsTab({ state, holdings, allSymbols = [], updater, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const txns = [...state.transactions]
    .filter(t => !filter || t.ticker.toLowerCase().includes(filter.toLowerCase()))
    .filter(t => typeFilter === 'All' || t.type === typeFilter)
    .sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));

  return (
    <div>
      <SectionTitle
        sub={`${state.transactions.length} total — includes buys, sells, fees, and tax`}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowImport(true)}>
              <FileSpreadsheet className="inline w-3.5 h-3.5 mr-1.5" />Import CSV
            </Button>
            <Button variant="dark" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="inline w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />New transaction
            </Button>
          </div>
        }
      >Transactions</SectionTitle>

      <div className="flex gap-2 mb-4">
        <Input placeholder="Filter by ticker…" value={filter} onChange={e => setFilter(e.target.value)} className="max-w-[240px]" />
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} options={['All', 'BUY', 'SELL']} />
      </div>

      
      {txns.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="text-[14px] font-semibold" style={{ color: C.ink }}>No transactions yet</div>
          <div className="text-[12px] mt-2" style={{ color: C.muted }}>
            Add your first trade — manually or via CSV import.
          </div>
        </Card>
      ) : (
        <Card pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Date', 'Type', 'Ticker', 'Qty', 'Price', 'Gross', 'Fees', 'Tax', 'Net', 'Strategy', ''].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {txns.map(t => {
                  const gross = Number(t.quantity) * Number(t.price);
                  const net = t.type === 'BUY'
                    ? -(gross + Number(t.fees || 0) + Number(t.tax || 0))
                    : gross - Number(t.fees || 0) - Number(t.tax || 0);
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.borderSoft}` }}
                      onMouseEnter={e => e.currentTarget.style.background = C.hover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-3 py-3" style={{ color: C.inkSoft }}>
                        {t.date}{t.time && <span className="ml-1 text-[10px]" style={{ color: C.muted }}>{t.time}</span>}
                      </td>
                      <td className="px-3 py-3"><Pill tone={t.type === 'BUY' ? 'info' : 'accent'}>{t.type}</Pill></td>
                      <td className="px-3 py-3" style={{ color: C.ink, fontWeight: 600 }}>{t.ticker}</td>
                      <td className="px-3 py-3" style={{ color: C.ink }}>{fmtNum(t.quantity, 0)}</td>
                      <td className="px-3 py-3" style={{ color: C.ink }}>{fmtNum(t.price, 2)}</td>
                      <td className="px-3 py-3" style={{ color: C.inkSoft }}>{fmtPKR(gross)}</td>
                      <td className="px-3 py-3" style={{ color: C.neg }}>{fmtPKR(t.fees || 0)}</td>
                      <td className="px-3 py-3" style={{ color: C.neg }}>{fmtPKR(t.tax || 0)}</td>
                      <td className="px-3 py-3" style={{ color: net >= 0 ? C.pos : C.neg, fontWeight: 600 }}>{fmtPKR(net)}</td>
                      <td className="px-3 py-3 text-[11px]" style={{ color: C.inkSoft, fontFamily: 'Inter' }}>{t.strategy || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-3 text-[10px] items-center" style={{ fontFamily: 'Inter' }}>
                          <button onClick={() => { setEditing(t); setShowForm(true); }} style={{ color: C.muted }} className="hover:opacity-70 font-medium">edit</button>
                          <button onClick={() => { if (confirm('Delete transaction?')) updater.deleteTxn(t.id); }} style={{ color: C.muted }} className="hover:opacity-70">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showForm && (
  <Modal onClose={() => setShowForm(false)} title={editing ? 'Edit transaction' : 'Record new transaction'} wide>
    <TransactionForm
      initial={editing}
      settings={{ ...state.settings, accounts: state.accounts, activeAccountId: state.activeAccountId }}
      holdings={holdings}
      allSymbols={allSymbols}
      onSubmit={t => {
        if (editing) updater.updateTxn(editing.id, t);
        else updater.addTxn(t);
        setShowForm(false);
        showToast(editing ? 'Transaction updated' : 'Transaction added', 'success');
      }}
    />
  </Modal>
)}

      {showImport && (
        <Modal onClose={() => setShowImport(false)} title="Import transactions from CSV" wide>
          <CSVImport
            onImport={rows => {
              updater.addTxnBulk(rows);
              setShowImport(false);
              showToast(`Imported ${rows.length} transaction${rows.length === 1 ? '' : 's'}`, 'success');
            }}
          />
        </Modal>
      )}
    </div>
  );
}
