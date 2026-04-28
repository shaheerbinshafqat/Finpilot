import React from 'react';
import { C } from '../theme.jsx';
import { fmtPKR, fmtNum } from '../lib/format.js';
import { Card, SectionTitle, Pill } from './ui.jsx';

function JournalLine({ label, text }) {
  return (
    <div className="text-[12.5px] mt-2 leading-relaxed" style={{ color: C.inkSoft }}>
      <span
        className="text-[10px] uppercase tracking-wider mr-2 font-semibold"
        style={{ color: C.accent }}
      >{label}</span>
      {text}
    </div>
  );
}

export default function JournalTab({ state }) {
  const journaled = [...state.transactions]
    .filter(t => t.entryReason || t.exitReason || t.lessons || t.news)
    .sort((a, b) => b.date.localeCompare(a.date));

  const closed = state.transactions.filter(t => t.type === 'SELL' && t.strategy && t.outcome);
  const byStrat = {};
  closed.forEach(t => {
    if (!byStrat[t.strategy]) byStrat[t.strategy] = { wins: 0, losses: 0, be: 0 };
    if (t.outcome === 'Win') byStrat[t.strategy].wins++;
    else if (t.outcome === 'Loss') byStrat[t.strategy].losses++;
    else byStrat[t.strategy].be++;
  });

  const byEmotion = {};
  closed.forEach(t => {
    if (!byEmotion[t.emotion]) byEmotion[t.emotion] = { wins: 0, total: 0 };
    byEmotion[t.emotion].total++;
    if (t.outcome === 'Win') byEmotion[t.emotion].wins++;
  });

  return (
    <div>
      <SectionTitle sub="The trades you review are the ones you learn from.">Trade Journal</SectionTitle>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
            Win rate by strategy
          </div>
          {Object.keys(byStrat).length ? (
            <div className="space-y-3">
              {Object.entries(byStrat)
                .sort((a, b) => (b[1].wins / (b[1].wins + b[1].losses || 1)) - (a[1].wins / (a[1].wins + a[1].losses || 1)))
                .map(([k, v]) => {
                  const total = v.wins + v.losses + v.be;
                  const wr = total ? (v.wins / total) * 100 : 0;
                  return (
                    <div key={k}>
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span style={{ color: C.ink, fontWeight: 600 }}>{k}</span>
                        <span className="font-mono" style={{ color: C.inkSoft }}>
                          {v.wins}W / {v.losses}L ·{' '}
                          <span style={{ color: wr >= 50 ? C.pos : C.neg, fontWeight: 600 }}>{wr.toFixed(0)}%</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden flex" style={{ background: C.borderSoft }}>
                        <div style={{ background: C.pos, width: `${total ? (v.wins / total) * 100 : 0}%` }} />
                        <div style={{ background: C.muted, width: `${total ? (v.be / total) * 100 : 0}%` }} />
                        <div style={{ background: C.neg, width: `${total ? (v.losses / total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-[12px]" style={{ color: C.whisper }}>
              Close trades (SELL) with strategy + outcome to see this.
            </div>
          )}
        </Card>

        <Card>
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
            Emotion → outcome
          </div>
          {Object.keys(byEmotion).length ? (
            <div className="space-y-2">
              {Object.entries(byEmotion).map(([k, v]) => {
                const wr = v.total ? (v.wins / v.total) * 100 : 0;
                return (
                  <div key={k} className="flex items-center justify-between text-[12px]">
                    <span style={{ color: C.ink }}>{k}</span>
                    <span className="font-mono" style={{ color: C.inkSoft }}>
                      {v.wins}/{v.total} ·{' '}
                      <span style={{ color: wr >= 50 ? C.pos : C.neg, fontWeight: 600 }}>{wr.toFixed(0)}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[12px]" style={{ color: C.whisper }}>
              Tag emotions on exits to see which mental states win.
            </div>
          )}
        </Card>
      </div>

      {journaled.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="text-[14px] font-semibold" style={{ color: C.ink }}>No journal entries yet</div>
          <div className="text-[11px] mt-2" style={{ color: C.muted }}>
            Open any transaction → expand "Trade Journal" to add reasoning, emotion, and lessons.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {journaled.map(t => (
            <Card key={t.id}>
              <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill tone={t.type === 'BUY' ? 'info' : 'accent'}>{t.type}</Pill>
                  <span className="font-mono text-[16px] font-bold" style={{ color: C.ink }}>{t.ticker}</span>
                  <span className="text-[11px]" style={{ color: C.muted }}>{t.date}</span>
                  {t.strategy && <Pill>{t.strategy}</Pill>}
                  {t.outcome && (
                    <Pill tone={t.outcome === 'Win' ? 'pos' : t.outcome === 'Loss' ? 'neg' : 'neutral'}>
                      {t.outcome}
                    </Pill>
                  )}
                  {t.emotion && <Pill tone="neutral">{t.emotion}</Pill>}
                </div>
                <div className="font-mono text-[12px] font-semibold" style={{ color: C.inkSoft }}>
                  {fmtNum(t.quantity, 0)} @ {fmtPKR(t.price, 2)}
                </div>
              </div>
              {t.entryReason && <JournalLine label="Entry" text={t.entryReason} />}
              {t.exitReason && <JournalLine label="Exit" text={t.exitReason} />}
              {t.news && <JournalLine label="News" text={t.news} />}
              {t.lessons && <JournalLine label="Lesson" text={t.lessons} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
