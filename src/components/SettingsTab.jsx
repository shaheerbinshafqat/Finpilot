import React, { useState } from 'react';
import { Sun, Moon, Webhook, Download, Upload } from 'lucide-react';
import { C, useTheme } from '../theme.jsx';
import { COST_BASIS_METHODS } from '../constants.js';
import { defaultState } from '../lib/storage.js';
import { fireWebhooks } from '../lib/webhooks.js';
import { Card, SectionTitle, Label, Input, Select, Textarea, Button, Pill } from './ui.jsx';


//NEW
import { downloadBackup, pickBackupFolder } from '../lib/backup.js';
import { applySplit } from '../lib/corporateActions.js';


export default function SettingsTab({ state, updater, showToast }) {
  const { theme, setTheme } = useTheme();
  const [kseVal, setKseVal] = useState('');
  const [importText, setImportText] = useState('');
  const [testing, setTesting] = useState(false);
  
  //NEW
  const [folderName, setFolderName] = useState(localStorage.getItem('psx_backup_folder_name') || null);
  const [splitTicker, setSplitTicker] = useState('');
  const [splitRatio, setSplitRatio] = useState('');
  const [splitDate, setSplitDate] = useState(new Date().toISOString().slice(0, 10));
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('CDC');
  const [benchId, setBenchId] = useState('kse100');
  const [benchVal, setBenchVal] = useState('');

  const BENCHMARKS = [
  { id: 'kse100', label: 'KSE-100', hint: 'Main PSX index' },
  { id: 'kse30', label: 'KSE-30', hint: 'Top 30 PSX' },
  { id: 'kmi30', label: 'KMI-30', hint: 'Sharia-compliant' },
  { id: 'tbill', label: 'T-bill rate (%)', hint: '6-month SBP rate, e.g. 20.5' },
  { id: 'inflation', label: 'CPI inflation (%)', hint: 'PBS monthly CPI YoY, e.g. 23.5' },
];
      
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported', 'success');
  };

  const importData = () => {
    try {
      const s = JSON.parse(importText);
      if (!s.transactions) throw new Error('Not a valid backup');
      if (confirm('Overwrite all current data with imported file?')) {
        updater.replaceAll({
          ...defaultState,
          ...s,
          settings: { ...defaultState.settings, ...(s.settings || {}) },
        });
        showToast('Restored', 'success');
      }
    } catch (e) {
      showToast('Invalid JSON: ' + e.message, 'error');
    }
  };

  const testWebhook = async idx => {
    const url = state.settings.webhookUrls[idx];
    if (!url) return showToast('Enter a webhook URL first', 'error');
    setTesting(true);
    const results = await fireWebhooks([url], {
      event: 'test',
      message: 'FinPilot webhook test',
      timestamp: new Date().toISOString(),
      ticker: 'TEST',
      alertType: 'target',
      currentPrice: 100,
      targetPrice: 95,
      source: 'FinPilot',
    });
    setTesting(false);
    const ok = results[0]?.ok;
    showToast(
      ok ? 'Webhook fired — check your Zap/IFTTT/Make history'
        : 'Request sent, but endpoint returned an error. Check the URL.',
      ok ? 'success' : 'warn'
    );
  };

  return (
    <div>
      <SectionTitle sub="Customize your FinPilot experience.">Settings</SectionTitle>
      
     {/*  New Accounts management card */}
<Card className="mb-4">
  <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
    Accounts ({state.accounts.length})
  </div>
  <div className="space-y-2 mb-4">
    {state.accounts.map(a => (
      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl"
        style={{ background: C.bg, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded" style={{ background: a.color || C.accent }} />
          <span style={{ color: C.ink, fontWeight: 600 }}>{a.name}</span>
          <Pill>{a.type}</Pill>
          {a.id === 'default' && <Pill tone="info">Default</Pill>}
        </div>
        {a.id !== 'default' && state.accounts.length > 1 && (
          <Button variant="ghost" onClick={() => {
            if (confirm(`Delete account "${a.name}"? Transactions tagged with it will still exist but won't be filtered.`)) {
              updater.deleteAccount(a.id);
              showToast('Account deleted', 'success');
            }
          }}>Delete</Button>
        )}
      </div>
    ))}
  </div>
  <div className="grid grid-cols-3 gap-3">
    <Input label="New account name" value={newAccountName}
      onChange={e => setNewAccountName(e.target.value)} placeholder="Joint Account" />
    <Select label="Type" value={newAccountType} onChange={e => setNewAccountType(e.target.value)}
      options={['CDC', 'Sub-account', 'Joint', 'Family', 'Corporate', 'Other']} />
    <div className="flex items-end">
      <Button variant="dark" onClick={() => {
        if (!newAccountName) return showToast('Enter account name', 'error');
        updater.addAccount({ name: newAccountName, type: newAccountType, color: C.accent });
        setNewAccountName('');
        showToast('Account added', 'success');
      }} className="w-full">Add account</Button>
    </div>
  </div>
</Card> 

      {/* Appearance */}
      <Card className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
          Appearance
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => theme !== 'light' && setTheme()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{
              background: theme === 'light' ? C.ink : C.card,
              color: theme === 'light' ? C.bg : C.inkSoft,
              border: `1px solid ${theme === 'light' ? 'transparent' : C.border}`,
            }}
          ><Sun className="w-4 h-4" /> Light</button>
          <button
            onClick={() => theme !== 'dark' && setTheme()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{
              background: theme === 'dark' ? C.ink : C.card,
              color: theme === 'dark' ? C.bg : C.inkSoft,
              border: `1px solid ${theme === 'dark' ? 'transparent' : C.border}`,
            }}
          ><Moon className="w-4 h-4" /> Dark</button>
        </div>
      </Card>

      {/* Trading defaults */}
      <Card className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
          Trading defaults
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Input label="Default Broker Fees (%)" type="number" step="0.01"
            value={state.settings.defaultFees}
            onChange={e => updater.updateSetting('defaultFees', Number(e.target.value))} />
          <Input label="Default CGT (%)" type="number" step="0.1"
            value={state.settings.defaultCGT}
            onChange={e => updater.updateSetting('defaultCGT', Number(e.target.value))} />
          <Input label="Concentration alert (% per stock)" type="number" step="1"
            value={state.settings.concentrationLimit}
            onChange={e => updater.updateSetting('concentrationLimit', Number(e.target.value))} />
            <Input label="Risk-free rate (annual, e.g. 0.20 for 20% T-bill)" type="number" step="0.01"
  value={state.settings.riskFreeRate ?? 0.20}
  onChange={e => updater.updateSetting('riskFreeRate', Number(e.target.value))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Cost basis method"
            value={state.settings.costBasisMethod}
            onChange={e => updater.updateSetting('costBasisMethod', e.target.value)}
            options={COST_BASIS_METHODS}
          />
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-[12px] pb-2" style={{ color: C.inkSoft }}>
              <input type="checkbox" checked={state.settings.autoFetchEnabled}
                onChange={e => updater.updateSetting('autoFetchEnabled', e.target.checked)} />
              Auto-fetch prices every 10 minutes
            </label>
          </div>
        </div>
        <p className="text-[11px] mt-4 leading-relaxed" style={{ color: C.muted }}>
          Switching cost basis recomputes all realized P&L. <strong style={{ color: C.inkSoft }}>FIFO</strong> is standard for most tax regimes;{' '}
          <strong style={{ color: C.inkSoft }}>LIFO</strong> shows last-lot economics;{' '}
          <strong style={{ color: C.inkSoft }}>Average cost</strong> smooths noise when you accumulate gradually.
        </p>
      </Card>

      {/* Webhooks */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Webhook className="w-4 h-4" style={{ color: C.accent }} />
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>
            SMS & email alerts via webhook
          </div>
        </div>
        
        <div className="mb-4 p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: C.warnSoft, color: C.warn }}>
  <strong>Heads up:</strong> Webhooks only fire when this browser tab is open and an alert triggers during auto-fetch. For true 24/7 monitoring, you need a server-side polling job.
</div>

        <p className="text-[12px] mb-4 leading-relaxed" style={{ color: C.inkSoft }}>
          When an alert triggers, this app POSTs a JSON payload to your webhook URL(s).
          Wire that endpoint through <strong>Zapier</strong>, <strong>IFTTT</strong>,
          <strong> Make.com</strong>, or <strong>Pabbly</strong> to route notifications to email, SMS, WhatsApp, Telegram — anywhere.
        </p>

        {[0, 1].map(idx => (
          <div key={idx} className="mb-3">
            <Label>{`Webhook URL ${idx + 1}`}</Label>
            <div className="flex gap-2">
              <input
                type="url"
                value={state.settings.webhookUrls?.[idx] || ''}
                onChange={e => updater.updateWebhookUrl(idx, e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/…"
                className="flex-1 rounded-xl px-3 py-2.5 text-[12px] font-mono focus:outline-none"
                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.ink }}
              />
              <Button variant="ghost" onClick={() => testWebhook(idx)} disabled={testing}>
                {testing ? 'Sending…' : 'Test'}
              </Button>
            </div>
          </div>
        ))}

        <div className="mt-4">
          <label className="flex items-center gap-2 text-[12px]" style={{ color: C.inkSoft }}>
            <input
              type="checkbox"
              checked={state.settings.webhookEvents?.alerts ?? true}
              onChange={e => updater.updateSetting('webhookEvents', {
                ...state.settings.webhookEvents, alerts: e.target.checked,
              })}
            />
            Fire webhook when any alert triggers (price, stop, big move, volume spike)
          </label>
        </div>

        <details className="mt-5 rounded-xl" style={{ border: `1px solid ${C.border}` }}>
          <summary className="cursor-pointer px-3.5 py-2.5 text-[12px] font-semibold" style={{ color: C.ink }}>
            Setup guides for SMS & email →
          </summary>
          <div className="p-4 space-y-4 text-[12px] leading-relaxed" style={{ color: C.inkSoft, borderTop: `1px solid ${C.border}` }}>
            <div>
              <strong style={{ color: C.ink }}>Email via Zapier (free tier works):</strong>
              <ol className="mt-1 ml-4 list-decimal space-y-0.5">
                <li>Create a Zap → Trigger: "Webhooks by Zapier" → "Catch Hook"</li>
                <li>Copy the webhook URL into the field above</li>
                <li>Action: "Email by Zapier" → compose subject <code>{'{{ticker}} {{alertType}} triggered'}</code></li>
                <li>Hit "Test" above — the email should arrive in seconds</li>
              </ol>
            </div>
            <div>
              <strong style={{ color: C.ink }}>SMS via IFTTT:</strong>
              <ol className="mt-1 ml-4 list-decimal space-y-0.5">
                <li>New applet → Trigger: "Webhooks" (event name e.g. <code>psx_alert</code>)</li>
                <li>Your URL: <code>https://maker.ifttt.com/trigger/psx_alert/json/with/key/YOUR_KEY</code></li>
                <li>Action: SMS (via IFTTT SMS or Twilio)</li>
              </ol>
            </div>
            <div>
              <strong style={{ color: C.ink }}>WhatsApp via Make.com:</strong>
              <ol className="mt-1 ml-4 list-decimal space-y-0.5">
                <li>New scenario → "Webhooks" instant module → copy URL here</li>
                <li>Add "WhatsApp Business" module → compose from payload fields</li>
              </ol>
            </div>
            <div className="mt-3 p-3 rounded-xl font-mono text-[11px]" style={{ background: C.bg, color: C.inkSoft }}>
              <div className="mb-1" style={{ color: C.muted }}>Payload structure:</div>
              {JSON.stringify({
                event: 'alert_triggered',
                alertType: 'target',
                ticker: 'LUCK',
                targetPrice: 1300,
                currentPrice: 1310.5,
                dayChange: 2.1,
                volume: 850000,
                note: 'Book 50%',
                timestamp: '2026-04-18T11:22:00Z',
                source: 'FinPilot',
              }, null, 2)}
            </div>
          </div>
        </details>
      </Card>

      {/* Benchmarks */}
      <Card className="mb-4">
  <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
    Benchmarks
  </div>
  <p className="text-[12px] mb-3 leading-relaxed" style={{ color: C.inkSoft }}>
    Log benchmark values to compare your portfolio performance. Index values are auto-fetched from live market data when available.
  </p>
  <div className="grid grid-cols-3 gap-3 mb-3">
    <Select label="Benchmark" value={benchId} onChange={e => setBenchId(e.target.value)}
      options={BENCHMARKS.map(b => ({ value: b.id, label: b.label }))} />
    <Input label="Value" type="number" step="0.01" value={benchVal}
      onChange={e => setBenchVal(e.target.value)}
      placeholder={BENCHMARKS.find(b => b.id === benchId)?.hint} />
    <div className="flex items-end">
      <Button variant="dark" className="w-full" onClick={() => {
        if (!benchVal) return;
        updater.addBenchmarkValue(benchId, benchVal);
        setBenchVal('');
        showToast(`${BENCHMARKS.find(b => b.id === benchId)?.label} logged`, 'success');
      }}>Log value</Button>
    </div>
  </div>
  <div className="space-y-1.5">
    {BENCHMARKS.map(b => {
      const series = state.benchmarks?.[b.id] || [];
      return (
        <div key={b.id} className="flex items-center justify-between text-[11px] px-3 py-2.5 rounded-xl"
          style={{ background: C.bg, border: `1px solid ${C.borderSoft}` }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm" style={{ background: C.accent }} />
            <span style={{ color: C.inkSoft, fontWeight: 600 }}>{b.label}</span>
          </div>
          <span style={{ color: C.muted }}>
            {series.length === 0 ? 'No data yet' : `${series.length} entries · Latest: ${Number(series[series.length-1].value).toLocaleString()} (${series[series.length-1].date})`}
          </span>
        </div>
      );
    })}
  </div>
</Card>

      {/* Live price integration */}
      <Card className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
          Live price integration
        </div>
        <p className="text-[12px] mb-3 leading-relaxed" style={{ color: C.inkSoft }}>
          PSX doesn't publish an open public API. This app uses <span className="font-mono" style={{ color: C.accent }}>psxterminal.com</span> as the data source.
          Prices auto-refresh while the app is open.
          For reliable refresh, deploy this Apps Script and swap the fetch URL in <code>src/lib/prices.js</code>:
        </p>
        <details className="rounded-xl" style={{ border: `1px solid ${C.border}` }}>
          <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold" style={{ color: C.ink }}>
            Show Google Apps Script →
          </summary>
          <pre className="text-[10px] font-mono p-3 overflow-x-auto" style={{ background: C.bg, color: C.inkSoft, borderTop: `1px solid ${C.border}` }}>{`function doGet(e) {
  const ticker = e.parameter.t;
  const url = 'https://dps.psx.com.pk/timeseries/int/' + ticker;
  const resp = UrlFetchApp.fetch(url);
  return ContentService.createTextOutput(resp.getContentText())
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
        </details>
      </Card>

      {/* Backup */}
      <Card className="mb-4">
  <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
    Backup & restore
  </div>

  <div className="mb-4 p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: C.warnSoft, color: C.warn }}>
    <strong>All your data lives in this browser's localStorage.</strong> Clear cache, lose this device, or browser corruption = data gone. 
    Back up weekly. The app will auto-download a backup once a week, but picking a folder below is safer.
  </div>

  <div className="flex gap-3 flex-wrap mb-4">
    <Button variant="dark" onClick={() => { downloadBackup(state, 'manual'); showToast('Backup downloaded', 'success'); }}>
      <Download className="inline w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />Download now
    </Button>
    <Button variant="ghost" onClick={async () => {
      try {
        const name = await pickBackupFolder();
        setFolderName(name);
        localStorage.setItem('psx_backup_folder_name', name);
        showToast(`Auto-backups will save to "${name}"`, 'success');
      } catch (e) {
        showToast(e.message, 'error');
      }
    }}>
      Pick auto-backup folder
    </Button>
  </div>

  {folderName && (
    <div className="text-[11px] mb-4" style={{ color: C.muted }}>
      Auto-backups save weekly to: <span className="font-mono" style={{ color: C.ink }}>{folderName}/</span>
    </div>
  )}

  <div className="mt-4">
    <Textarea label="Paste backup JSON to restore" rows={4} value={importText}
      onChange={e => setImportText(e.target.value)} placeholder='{"transactions":[...], ...}' />
    <div className="mt-2">
      <Button variant="ghost" onClick={importData}>
        <Upload className="inline w-3.5 h-3.5 mr-1.5" />Restore
      </Button>
    </div>
  </div>
</Card>

      {/* Danger */}
      <Card style={{ borderLeft: `3px solid ${C.neg}` }}>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.neg }}>
          Danger zone
        </div>
        <p className="text-[12px] mb-3" style={{ color: C.inkSoft }}>
          Wipe all data and start fresh. This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => {
          if (confirm('Really delete everything?')) {
            updater.reset();
            showToast('Reset complete', 'success');
          }
        }}>Reset all data</Button>
      </Card>

        {/* applySplit */}
      <Card className="mb-4">
  <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
    Corporate actions — splits & bonuses
  </div>
  <p className="text-[12px] mb-3 leading-relaxed" style={{ color: C.inkSoft }}>
    When a stock splits or issues bonus shares, historical transactions need adjusting or your holdings will be wrong.
    This retroactively adjusts all transactions for that ticker before the effective date.
  </p>
  <div className="grid grid-cols-4 gap-3">
    <Input label="Ticker" value={splitTicker} onChange={e => setSplitTicker(e.target.value.toUpperCase())} placeholder="LUCK" />
    <Input label="Ratio (e.g. 2 for 2:1)" type="number" step="0.01" value={splitRatio} onChange={e => setSplitRatio(e.target.value)} />
    <Input label="Effective date" type="date" value={splitDate} onChange={e => setSplitDate(e.target.value)} />
    <div className="flex items-end">
      <Button variant="dark" onClick={() => {
        if (!splitTicker || !splitRatio || !splitDate) return showToast('Fill all fields', 'error');
        const ratio = Number(splitRatio);
        if (ratio <= 0 || ratio > 100) return showToast('Invalid ratio', 'error');
        if (!confirm(`Adjust all ${splitTicker} transactions before ${splitDate} by ratio ${ratio}?`)) return;
        const newTxns = applySplit(state.transactions, splitTicker, ratio, splitDate);
        updater.replaceAll({ ...state, transactions: newTxns });
        setSplitTicker(''); setSplitRatio('');
        showToast(`Split applied to ${splitTicker}`, 'success');
      }}>Apply split</Button>
    </div>
  </div>
</Card>

      <div className="mt-6 text-[11px] leading-relaxed max-w-2xl" style={{ color: C.muted }}>
        <strong style={{ color: C.inkSoft }}>A note on privacy.</strong>{' '}
        Your data lives in this browser via <code style={{ color: C.accent }}>localStorage</code>. It doesn't sync across devices unless you export/import.
        Webhook POSTs go directly from your browser to your chosen endpoint — no server in between.
      </div>
    </div>
  );
}
