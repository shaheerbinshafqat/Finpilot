import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Webhook,
  Trash2,
} from "lucide-react";
import { C } from "../theme.jsx";
import { fmtPKR, fmtNum, fmtPct } from "../lib/format.js";
import {
  Card,
  SectionTitle,
  Stat,
  Input,
  Select,
  Button,
  Pill,
} from "./ui.jsx";

const typeLabel = (t) =>
  ({
    target: "▲ Target",
    stoploss: "▼ Stop",
    bigmove: "±% Move",
    volspike: "🔥 Volume",
  })[t] || t;

export default function AlertsTab({ state, holdings, updater, showToast }) {
  const [form, setForm] = useState({
    ticker: "",
    type: "target",
    value: "",
    note: "",
    avgVolume: "",
  });

  const add = () => {
    if (!form.ticker || !form.value)
      return showToast("Fill ticker and value", "error");
    const payload = {
      ...form,
      ticker: form.ticker.toUpperCase(),
      value: Number(form.value),
    };
    if (form.type === "volspike" && form.avgVolume)
      payload.avgVolume = Number(form.avgVolume);
    updater.addAlert(payload);
    setForm({ ticker: "", type: "target", value: "", note: "", avgVolume: "" });
    showToast("Alert added", "success");
  };

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const concLimit = state.settings.concentrationLimit || 25;
  const concentrationWarnings = holdings
    .map((h) => ({
      ...h,
      weight: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
    }))
    .filter((h) => h.weight > concLimit);

  const hasWebhook = (state.settings.webhookUrls || []).some(Boolean);
  const webhookActive = hasWebhook && state.settings.webhookEvents?.alerts;

  const valueHint = () => {
    if (form.type === "target" || form.type === "stoploss") return "Price (₨)";
    if (form.type === "bigmove") return "% threshold (e.g. 5)";
    if (form.type === "volspike") return "Multiplier (e.g. 2 = 2× avg)";
    return "Value";
  };

  return (
    <div>
      <SectionTitle sub="Prices, volume, concentration — you'll know the moment it matters.">
        Alerts & Risk
        <div
          className="mb-4 p-4 rounded-xl flex gap-3 items-start"
          style={{ background: C.warnSoft, border: `1px solid ${C.warn}` }}
        >
          <AlertTriangle
            className="w-5 h-5 mt-0.5 shrink-0"
            style={{ color: C.warn }}
          />
          <div>
            <div
              className="text-[13px] font-semibold mb-1"
              style={{ color: C.warn }}
            >
              Alerts only fire while this browser tab is open
            </div>
            <div
              className="text-[12px] leading-relaxed"
              style={{ color: C.inkSoft }}
            >
              This tool runs entirely in your browser. Price checks happen when
              auto-fetch runs (every 10 minutes while the tab is open) or when
              you hit Refresh.
              <strong>
                {" "}
                If the tab is closed, alerts won't trigger and webhooks won't
                fire.
              </strong>{" "}
              For 24/7 alerts, deploy the Google Apps Script shown in Settings →
              Live Price Integration to a time-triggered Apps Script project, or
              use a paid service like TradingView.
            </div>
          </div>
        </div>
      </SectionTitle>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Stat
          label="Active alerts"
          value={state.alerts.filter((a) => a.active && !a.triggered).length}
          tone="accent"
          icon={<Bell className="w-4 h-4" style={{ color: C.muted }} />}
        />
        <Stat
          label="Triggered"
          value={state.alerts.filter((a) => a.triggered).length}
          tone="pos"
          icon={<CheckCircle2 className="w-4 h-4" style={{ color: C.muted }} />}
        />
        <Stat
          label="Concentration warnings"
          value={concentrationWarnings.length}
          tone={concentrationWarnings.length ? "neg" : "neutral"}
          icon={
            <AlertTriangle className="w-4 h-4" style={{ color: C.muted }} />
          }
        />
        <Card>
          <div className="flex items-start justify-between mb-2">
            <div className="text-[11px] font-medium" style={{ color: C.muted }}>
              Webhooks
            </div>
            <Webhook
              className="w-4 h-4"
              style={{ color: webhookActive ? C.pos : C.muted }}
            />
          </div>
          <div
            className="font-display text-[18px] font-bold leading-none"
            style={{ color: webhookActive ? C.pos : C.muted }}
          >
            {webhookActive ? "Active" : "Off"}
          </div>
          <div className="text-[11px] mt-2" style={{ color: C.muted }}>
            {webhookActive ? "SMS/email on trigger" : "Configure in Settings"}
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <div
          className="text-[11px] font-semibold uppercase tracking-wider mb-3"
          style={{ color: C.muted }}
        >
          New alert
        </div>
        <div className="grid grid-cols-6 gap-3">
          <Input
            label="Ticker"
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
            placeholder="LUCK"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: "target", label: "▲ Target (price ≥)" },
              { value: "stoploss", label: "▼ Stop-Loss (price ≤)" },
              { value: "bigmove", label: "±% Day-over-day move" },
              { value: "volspike", label: "🔥 Volume spike (× avg)" },
            ]}
          />
          <Input
            label={valueHint()}
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          {form.type === "volspike" && (
            <Input
              label="Avg volume (baseline)"
              type="number"
              step="1"
              value={form.avgVolume}
              onChange={(e) => setForm({ ...form, avgVolume: e.target.value })}
              placeholder="e.g. 500000"
            />
          )}
          <Input
            label="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Book 50%"
            className={form.type === "volspike" ? "" : "col-span-2"}
          />
          <div className="flex items-end">
            <Button variant="dark" onClick={add} className="w-full">
              Add alert
            </Button>
          </div>
        </div>
        {form.type === "bigmove" && (
          <div
            className="text-[11px] mt-3 p-3 rounded-xl"
            style={{ background: C.infoSoft, color: C.info }}
          >
            Fires when the day-over-day price change crosses ±
            {form.value || "X"}%. Requires live fetch with previous-close.
          </div>
        )}
        {form.type === "volspike" && (
          <div
            className="text-[11px] mt-3 p-3 rounded-xl"
            style={{ background: C.warnSoft, color: C.warn }}
          >
            Fires when today's volume ≥ multiplier × avg. Set a baseline "avg
            volume" yourself (check dps.psx.com.pk → 30-day avg).
          </div>
        )}
      </Card>

      {concentrationWarnings.length > 0 && (
        <Card className="mb-4" style={{ borderLeft: `3px solid ${C.warn}` }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: C.warn }} />
            <div
              className="text-[11px] uppercase tracking-wider font-bold"
              style={{ color: C.warn }}
            >
              Portfolio Concentration Risk
            </div>
          </div>
          <div className="space-y-2">
            {concentrationWarnings.map((h) => (
              <div
                key={h.ticker}
                className="flex items-center justify-between text-[12px]"
              >
                <span
                  className="font-mono font-semibold"
                  style={{ color: C.ink }}
                >
                  {h.ticker}
                </span>
                <span style={{ color: C.inkSoft }}>
                  is{" "}
                  <span
                    className="font-mono font-bold"
                    style={{ color: C.warn }}
                  >
                    {h.weight.toFixed(1)}%
                  </span>{" "}
                  of portfolio (limit: {concLimit}%)
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {state.alerts.length === 0 ? (
        <Card className="py-14 text-center">
          <div className="text-[13px]" style={{ color: C.whisper }}>
            No alerts set.
          </div>
        </Card>
      ) : (
        <Card pad={false}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {[
                  "Ticker",
                  "Type",
                  "Threshold",
                  "Current",
                  "Status",
                  "Note",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-3 text-[10px] uppercase tracking-wider font-semibold"
                    style={{ color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.alerts.map((a) => {
                const rec = state.prices[a.ticker];
                const current = rec?.price;
                let currentDisplay = "—",
                  distance = null;
                if (a.type === "target" || a.type === "stoploss") {
                  currentDisplay =
                    current !== undefined ? fmtNum(current, 2) : "—";
                  distance =
                    current !== undefined
                      ? ((a.value - current) / current) * 100
                      : null;
                } else if (a.type === "bigmove" && rec?.prev) {
                  const chg = ((rec.price - rec.prev) / rec.prev) * 100;
                  currentDisplay = fmtPct(chg);
                } else if (
                  a.type === "volspike" &&
                  rec?.volume &&
                  a.avgVolume
                ) {
                  currentDisplay = `${(rec.volume / a.avgVolume).toFixed(2)}×`;
                }
                return (
                  <tr
                    key={a.id}
                    style={{ borderBottom: `1px solid ${C.borderSoft}` }}
                  >
                    <td
                      className="px-3 py-3 font-mono font-semibold"
                      style={{ color: C.ink }}
                    >
                      {a.ticker}
                    </td>
                    <td className="px-3 py-3">
                      <Pill
                        tone={
                          a.type === "target"
                            ? "pos"
                            : a.type === "stoploss"
                              ? "neg"
                              : a.type === "bigmove"
                                ? "info"
                                : "warn"
                        }
                      >
                        {typeLabel(a.type)}
                      </Pill>
                    </td>
                    <td
                      className="px-3 py-3 font-mono"
                      style={{ color: C.ink }}
                    >
                      {a.type === "bigmove"
                        ? `±${a.value}%`
                        : a.type === "volspike"
                          ? `${a.value}×`
                          : fmtNum(a.value, 2)}
                    </td>
                    <td
                      className="px-3 py-3 font-mono"
                      style={{ color: C.inkSoft }}
                    >
                      {currentDisplay}
                      {distance !== null && (
                        <span
                          className="text-[10px] ml-2"
                          style={{ color: C.muted }}
                        >
                          ({fmtPct(distance)})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {a.triggered ? (
                        <Pill tone="warn">Triggered</Pill>
                      ) : (
                        <Pill tone="info">Watching</Pill>
                      )}
                    </td>
                    <td className="px-3 py-3" style={{ color: C.inkSoft }}>
                      {a.note}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => updater.deleteAlert(a.id)}
                        style={{ color: C.muted }}
                        className="hover:opacity-70"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
