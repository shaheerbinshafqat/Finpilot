import React, { useState } from 'react';
import { History, Undo2, Trash2 } from 'lucide-react';
import { C } from '../theme.jsx';
import { Card, SectionTitle, Pill, Button } from './ui.jsx';

export default function AuditLogTab({ state, updater, showToast }) {
  const [filter, setFilter] = useState('all');
  const entries = state.auditLog || [];
  const deleted = state.deletedItems || [];

  const filtered = filter === 'all' ? entries : entries.filter(e => e.entityType === filter);

  const toneFor = (action) => ({
    create: 'pos', update: 'info', delete: 'neg', restore: 'accent',
  })[action] || 'neutral';

  return (
    <div>
      <SectionTitle sub="Every change is logged. Deleted items are recoverable for 30 days.">
        Audit Log
      </SectionTitle>

      {deleted.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
              Recoverable items ({deleted.length})
            </div>
            <Button variant="ghost" onClick={() => {
              if (confirm('Permanently delete all soft-deleted items?')) {
                updater.purgeDeleted();
                showToast('Purged', 'success');
              }
            }}>
              <Trash2 className="inline w-3.5 h-3.5 mr-1.5" />Purge all
            </Button>
          </div>
          <div className="space-y-2">
            {deleted.slice(0, 20).map(item => (
              <div key={item.id} className="flex items-center justify-between text-[12px] p-2 rounded-lg"
                style={{ background: C.bg }}>
                <div className="flex items-center gap-3">
                  <Pill tone="neg">{item._entityType}</Pill>
                  <span style={{ color: C.inkSoft }}>
                    {item.ticker || item.description || item.type}
                    {item.quantity ? ` — qty ${item.quantity}` : ''}
                    {item.amount ? ` — ₨${item.amount}` : ''}
                  </span>
                  <span className="text-[10px]" style={{ color: C.muted }}>
                    deleted {new Date(item._deletedAt).toLocaleDateString()}
                  </span>
                </div>
                <Button variant="ghost" onClick={() => {
                  updater.restoreDeleted(item.id);
                  showToast('Restored', 'success');
                }}>
                  <Undo2 className="inline w-3.5 h-3.5 mr-1.5" />Restore
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-2 mb-4">
        {['all', 'transaction', 'expense', 'cashMove', 'alert'].map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
            style={{
              background: filter === k ? C.ink : C.card,
              color: filter === k ? C.bg : C.inkSoft,
              border: `1px solid ${C.border}`,
            }}>{k}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-14 text-center">
          <History className="w-8 h-8 mx-auto mb-2" style={{ color: C.whisper }} />
          <div className="text-[13px]" style={{ color: C.whisper }}>No audit entries yet.</div>
        </Card>
      ) : (
        <Card pad={false}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['When', 'Action', 'Type', 'Summary'].map(h =>
                  <th key={h} className="text-left px-3 py-3 text-[10px] uppercase tracking-wider font-semibold"
                    style={{ color: C.muted }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(e => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: C.muted }}>
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5"><Pill tone={toneFor(e.action)}>{e.action}</Pill></td>
                  <td className="px-3 py-2.5" style={{ color: C.inkSoft }}>{e.entityType}</td>
                  <td className="px-3 py-2.5" style={{ color: C.ink }}>{e.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}