import React, { useState, useMemo } from 'react';
import { Calculator, Info, FileText, CheckCircle, AlertTriangle, ShieldAlert, Coins, TrendingDown, Percent } from 'lucide-react';
import { C } from '../theme.jsx';
import { Card, SectionTitle, Input, Select, Button, Label } from './ui.jsx';

function fmtPKR(num) {
  return Number(num).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeCGTRate(buyDate, sellDate, isFiler) {
  const buy = new Date(buyDate);
  const sell = new Date(sellDate);
  const holdYears = (sell - buy) / (1000 * 60 * 60 * 24 * 365.25);
  
  if (buy < new Date('2013-07-01')) return 0;
  if (buy >= new Date('2013-07-01') && buy < new Date('2022-07-01')) return isFiler ? 0.125 : 0.25;
  if (buy >= new Date('2022-07-01') && buy < new Date('2024-07-01')) {
    if (holdYears < 2) return isFiler ? 0.125 : 0.25;
    if (holdYears < 3) return isFiler ? 0.10 : 0.20;
    if (holdYears < 4) return isFiler ? 0.075 : 0.15;
    if (holdYears < 5) return isFiler ? 0.05 : 0.10;
    if (holdYears < 6) return isFiler ? 0.025 : 0.05;
    return 0;
  }
  if (buy >= new Date('2024-07-01') && buy < new Date('2025-07-01')) return isFiler ? 0.15 : 0.30;
  if (buy >= new Date('2025-07-01')) return 0.15; // same for both
  return 0;
}

export default function CalculatorsTab() {
  const [activeTab, setActiveTab] = useState('cgt');
  
  // CGT State
  const [cgtIsFiler, setCgtIsFiler] = useState(true);
  const [cgtInvType, setCgtInvType] = useState('individual');
  const [cgtBuyDate, setCgtBuyDate] = useState('');
  const [cgtSellDate, setCgtSellDate] = useState('');
  const [cgtShares, setCgtShares] = useState('');
  const [cgtBuyPrice, setCgtBuyPrice] = useState('');
  const [cgtSellPrice, setCgtSellPrice] = useState('');
  const [cgtHasLosses, setCgtHasLosses] = useState(false);
  const [cgtLossAmount, setCgtLossAmount] = useState('');

  // Cost State
  const [costValue, setCostValue] = useState('');
  const [costType, setCostType] = useState('buy');
  const [costBrokerage, setCostBrokerage] = useState('0.15');
  const [costProvince, setCostProvince] = useState('sindh');

  // Dividend State
  const [divPerShare, setDivPerShare] = useState('');
  const [divShares, setDivShares] = useState('');
  const [divIsFiler, setDivIsFiler] = useState(true);

  // --- CGT Logic ---
  const cgtResult = useMemo(() => {
    if (!cgtBuyDate || !cgtSellDate || !cgtShares || !cgtBuyPrice || !cgtSellPrice) return null;
    const b = new Date(cgtBuyDate);
    const s = new Date(cgtSellDate);
    if (s < b) return { error: 'Sale date cannot be before acquisition date.' };
    
    const qty = parseFloat(cgtShares);
    const bp = parseFloat(cgtBuyPrice);
    const sp = parseFloat(cgtSellPrice);
    if (isNaN(qty) || isNaN(bp) || isNaN(sp)) return null;

    const buyValue = qty * bp;
    const sellValue = qty * sp;
    const grossGain = sellValue - buyValue;
    
    // NCCPL Deemed Expenses (0.5% of sale proceeds is common, though strictly it's applied on sale proceeds for gain calculations in some cases, but legally actual costs or 0.5% deemed is used)
    const deemedExp = sellValue * 0.005; 
    let netTaxableGain = grossGain > 0 ? Math.max(0, grossGain - deemedExp) : grossGain;

    if (cgtHasLosses && netTaxableGain > 0) {
      const lossToOffset = parseFloat(cgtLossAmount) || 0;
      netTaxableGain = Math.max(0, netTaxableGain - lossToOffset);
    }

    const rate = computeCGTRate(cgtBuyDate, cgtSellDate, cgtIsFiler);
    const taxAmt = netTaxableGain > 0 ? netTaxableGain * rate : 0;
    const netProfit = grossGain - taxAmt;
    const effectiveRate = grossGain > 0 ? (taxAmt / grossGain) : 0;

    const holdMs = s - b;
    const holdYears = Math.floor(holdMs / (1000 * 60 * 60 * 24 * 365.25));
    const holdMonths = Math.floor((holdMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

    return {
      buyValue, sellValue, grossGain, deemedExp, netTaxableGain, rate, taxAmt, netProfit, effectiveRate, holdYears, holdMonths
    };
  }, [cgtBuyDate, cgtSellDate, cgtShares, cgtBuyPrice, cgtSellPrice, cgtIsFiler, cgtHasLosses, cgtLossAmount]);

  // --- Cost Logic ---
  const costResult = useMemo(() => {
    if (!costValue || isNaN(parseFloat(costValue))) return null;
    const val = parseFloat(costValue);
    const multiplier = costType === 'both' ? 2 : 1;
    const tv = val * multiplier;
    
    const brkRate = parseFloat(costBrokerage) / 100;
    const brokerage = tv * brkRate;
    
    // SST Rates: Sindh 13%, Punjab 16%, KPK 15%, Bal 15%, ICT 15%
    const sstRates = { sindh: 0.13, punjab: 0.16, kpk: 0.15, balochistan: 0.15, ict: 0.15, ajk: 0.15, gb: 0.15 };
    const sstRate = sstRates[costProvince] || 0.13;
    const sst = brokerage * sstRate;
    
    const psxFee = (tv / 100000) * 3.50;
    const secpLevy = (tv / 100000) * 0.65;
    const sstOnPsx = psxFee * sstRate;
    
    const nccplFee = (tv / 100000) * 2; // Approximate
    const cdcFee = 0; // CDC is usually per share or fixed holding, skip here for simplicity or add generic
    
    const totalCost = brokerage + sst + psxFee + secpLevy + sstOnPsx + nccplFee;
    const pct = totalCost / tv;

    return { tv, brokerage, sst, psxFee, secpLevy, sstOnPsx, nccplFee, totalCost, pct };
  }, [costValue, costType, costBrokerage, costProvince]);

  // --- Dividend Logic ---
  const divResult = useMemo(() => {
    if (!divPerShare || !divShares || isNaN(parseFloat(divPerShare)) || isNaN(parseFloat(divShares))) return null;
    const dps = parseFloat(divPerShare);
    const qty = parseFloat(divShares);
    const gross = dps * qty;
    const rate = divIsFiler ? 0.15 : 0.30;
    const tax = gross * rate;
    const net = gross - tax;
    return { gross, rate, tax, net };
  }, [divPerShare, divShares, divIsFiler]);

  return (
    <div className="pb-10">
      <SectionTitle 
        sub="Calculate your accurate capital gains tax, trading costs, and dividend taxes on the PSX based on the Finance Act 2025."
        action={
          <div className="text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: C.accentSoft, color: C.accent }}>
            <ShieldAlert className="w-3.5 h-3.5" /> Updated: Tax Year 2026
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-7 h-7" style={{ color: C.accent }} />
          Calculators
        </div>
      </SectionTitle>

      <div className="flex items-center gap-2 mb-6 border-b" style={{ borderColor: C.border }}>
        {[
          { id: 'cgt', label: 'Capital Gains Tax (CGT)', icon: Percent },
          { id: 'cost', label: 'Trading Costs', icon: TrendingDown },
          { id: 'div', label: 'Dividend Tax', icon: Coins }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-4 py-3 text-[13px] font-semibold flex items-center gap-2 transition-colors relative"
            style={{ 
              color: activeTab === t.id ? C.ink : C.muted,
              borderBottom: activeTab === t.id ? `2px solid ${C.accent}` : '2px solid transparent'
            }}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'cgt' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <Card>
              <div className="text-[14px] font-bold mb-4 flex items-center gap-2" style={{ color: C.ink }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: C.accent, color: C.accentInk }}>1</span>
                Investor Profile
              </div>
              <div className="space-y-4">
                <div>
                  <Label>ATL Status (Filer Status)</Label>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => setCgtIsFiler(true)} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-colors flex items-center justify-center gap-2"
                      style={{ background: cgtIsFiler ? C.posSoft : C.bg, color: cgtIsFiler ? C.pos : C.muted, border: `1px solid ${cgtIsFiler ? C.pos : C.border}` }}>
                      {cgtIsFiler && <CheckCircle className="w-3.5 h-3.5" />} On ATL (Filer)
                    </button>
                    <button onClick={() => setCgtIsFiler(false)} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-colors flex items-center justify-center gap-2"
                      style={{ background: !cgtIsFiler ? C.negSoft : C.bg, color: !cgtIsFiler ? C.neg : C.muted, border: `1px solid ${!cgtIsFiler ? C.neg : C.border}` }}>
                      {!cgtIsFiler && <AlertTriangle className="w-3.5 h-3.5" />} Not on ATL
                    </button>
                  </div>
                  <div className="mt-2 flex items-start gap-1.5 text-[11px]" style={{ color: C.muted }}>
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Active Taxpayer List (ATL) status significantly impacts your CGT rate for securities acquired before July 1, 2025.</span>
                  </div>
                </div>
                <Select label="Investor Type" value={cgtInvType} onChange={e => setCgtInvType(e.target.value)}
                  options={[{value:'individual', label:'Individual / AOP'}, {value:'company', label:'Company'}]} />
              </div>
            </Card>

            <Card>
              <div className="text-[14px] font-bold mb-4 flex items-center gap-2" style={{ color: C.ink }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: C.accent, color: C.accentInk }}>2</span>
                Transaction Details
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Acquisition Date" type="date" value={cgtBuyDate} onChange={e => setCgtBuyDate(e.target.value)} />
                  <Input label="Sale Date" type="date" value={cgtSellDate} onChange={e => setCgtSellDate(e.target.value)} />
                </div>
                {cgtBuyDate && cgtSellDate && cgtResult && !cgtResult.error && (
                  <div className="px-3 py-2 rounded-lg text-[11px] font-medium" style={{ background: C.hover, color: C.inkSoft }}>
                    Holding Period: {cgtResult.holdYears} years, {cgtResult.holdMonths} months
                  </div>
                )}
                
                <Input label="Number of Shares" type="number" placeholder="e.g. 1000" value={cgtShares} onChange={e => setCgtShares(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Purchase Price (PKR)" type="number" step="0.01" placeholder="0.00" value={cgtBuyPrice} onChange={e => setCgtBuyPrice(e.target.value)} />
                  <Input label="Sale Price (PKR)" type="number" step="0.01" placeholder="0.00" value={cgtSellPrice} onChange={e => setCgtSellPrice(e.target.value)} />
                </div>

                <div className="pt-3 border-t mt-3" style={{ borderColor: C.borderSoft }}>
                  <label className="flex items-center gap-2 text-[12px] font-semibold cursor-pointer mb-3" style={{ color: C.ink }}>
                    <input type="checkbox" checked={cgtHasLosses} onChange={e => setCgtHasLosses(e.target.checked)} className="rounded text-indigo-500" />
                    I have prior realized losses to offset
                  </label>
                  {cgtHasLosses && (
                    <Input type="number" placeholder="Loss Amount (PKR)" value={cgtLossAmount} onChange={e => setCgtLossAmount(e.target.value)} />
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div>
            <div className="sticky top-24">
              <Card pad={false} className="overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between" style={{ background: C.cardElev, borderColor: C.border }}>
                  <h3 className="text-[16px] font-bold" style={{ color: C.ink }}>Results Dashboard</h3>
                  <button onClick={() => window.print()} className="text-[11px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ background: C.hover, color: C.inkSoft }}>
                    <FileText className="w-3.5 h-3.5" /> Print / Save
                  </button>
                </div>
                
                {cgtResult?.error ? (
                  <div className="p-8 text-center text-[13px]" style={{ color: C.neg }}>{cgtResult.error}</div>
                ) : !cgtResult ? (
                  <div className="p-12 text-center text-[13px]" style={{ color: C.muted }}>Fill in all transaction details to see CGT calculation.</div>
                ) : (
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Applicable CGT Rate</div>
                        <div className="text-[28px] font-display font-bold" style={{ color: C.accent }}>{(cgtResult.rate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Effective Tax Rate</div>
                        <div className="text-[28px] font-display font-bold" style={{ color: C.inkSoft }}>{(cgtResult.effectiveRate * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t" style={{ borderColor: C.borderSoft }}>
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: C.inkSoft }}>Total Buy Value</span>
                        <span className="font-mono font-medium" style={{ color: C.ink }}>Rs {fmtPKR(cgtResult.buyValue)}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: C.inkSoft }}>Total Sell Value</span>
                        <span className="font-mono font-medium" style={{ color: C.ink }}>Rs {fmtPKR(cgtResult.sellValue)}</span>
                      </div>
                      <div className="flex justify-between text-[13px] pt-1">
                        <span className="font-semibold" style={{ color: C.ink }}>Gross Capital Gain</span>
                        <span className="font-mono font-bold" style={{ color: cgtResult.grossGain >= 0 ? C.pos : C.neg }}>
                          {cgtResult.grossGain >= 0 ? '+' : ''}Rs {fmtPKR(cgtResult.grossGain)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t" style={{ borderColor: C.borderSoft }}>
                      <div className="flex justify-between text-[13px]">
                        <span className="flex items-center gap-1" style={{ color: C.muted }}>
                          NCCPL Deemed Exp (0.5%) <Info className="w-3 h-3" title="0.5% of sale proceeds deducted for client trades" />
                        </span>
                        <span className="font-mono" style={{ color: C.neg }}>- Rs {fmtPKR(cgtResult.deemedExp)}</span>
                      </div>
                      {cgtHasLosses && (
                        <div className="flex justify-between text-[13px]">
                          <span style={{ color: C.muted }}>Loss Offset</span>
                          <span className="font-mono" style={{ color: C.neg }}>- Rs {fmtPKR(cgtLossAmount || 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[13px] pt-1">
                        <span className="font-semibold" style={{ color: C.ink }}>Net Taxable Gain</span>
                        <span className="font-mono font-semibold" style={{ color: C.ink }}>Rs {fmtPKR(cgtResult.netTaxableGain)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t" style={{ borderColor: C.borderSoft }}>
                      <div className="flex justify-between text-[14px]">
                        <span className="font-bold" style={{ color: C.neg }}>CGT Liability</span>
                        <span className="font-mono font-bold" style={{ color: C.neg }}>Rs {fmtPKR(cgtResult.taxAmt)}</span>
                      </div>
                      <div className="flex justify-between text-[15px] pt-2">
                        <span className="font-bold" style={{ color: C.pos }}>Net Profit After CGT</span>
                        <span className="font-mono font-black" style={{ color: cgtResult.netProfit >= 0 ? C.pos : C.neg }}>
                          {cgtResult.netProfit >= 0 ? '+' : ''}Rs {fmtPKR(cgtResult.netProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              
              {/* Super Tax Note */}
              <div className="mt-4 p-4 rounded-2xl flex gap-3 items-start" style={{ background: C.infoSoft, border: `1px solid ${C.info}33` }}>
                <Info className="w-5 h-5 shrink-0" style={{ color: C.info }} />
                <div className="text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
                  <strong style={{ color: C.ink }}>Super Tax (Section 4C)</strong><br />
                  For individuals with total income exceeding Rs 150 million, an additional Super Tax (1% to 10%) applies on capital gains.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cost' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Trade Value (PKR)" type="number" value={costValue} onChange={e => setCostValue(e.target.value)} />
              <Select label="Trade Type" value={costType} onChange={e => setCostType(e.target.value)}
                options={[{value:'buy', label:'One-way (Buy or Sell)'}, {value:'both', label:'Round-trip (Buy + Sell)'}]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Brokerage Commission (%)" type="number" step="0.01" value={costBrokerage} onChange={e => setCostBrokerage(e.target.value)} />
              <Select label="Province" value={costProvince} onChange={e => setCostProvince(e.target.value)}
                options={[
                  {value:'sindh', label:'Sindh (13%)'}, {value:'punjab', label:'Punjab (16%)'}, 
                  {value:'kpk', label:'KPK (15%)'}, {value:'balochistan', label:'Balochistan (15%)'},
                  {value:'ict', label:'ICT (15%)'}
                ]} />
            </div>
          </Card>

          <Card>
            <div className="text-[14px] font-bold mb-4" style={{ color: C.ink }}>Cost Breakdown</div>
            {!costResult ? (
              <div className="p-8 text-center text-[13px]" style={{ color: C.muted }}>Enter trade value to see breakdown.</div>
            ) : (
              <div className="space-y-3">
                {[
                  { l: 'Brokerage Commission', v: costResult.brokerage },
                  { l: 'Sales Tax (SST) on Brokerage', v: costResult.sst },
                  { l: 'PSX Trading Fee', v: costResult.psxFee },
                  { l: 'SECP Levy', v: costResult.secpLevy },
                  { l: 'Sales Tax on PSX Fee', v: costResult.sstOnPsx },
                  { l: 'NCCPL Clearing Fee', v: costResult.nccplFee },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-[13px]">
                    <span style={{ color: C.inkSoft }}>{item.l}</span>
                    <span className="font-mono" style={{ color: C.ink }}>Rs {fmtPKR(item.v)}</span>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between text-[15px] font-bold mt-2" style={{ borderColor: C.borderSoft, color: C.neg }}>
                  <span>Total Transaction Cost</span>
                  <span className="font-mono">Rs {fmtPKR(costResult.totalCost)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold" style={{ color: C.muted }}>
                  <span>Cost as % of Trade Value</span>
                  <span>{(costResult.pct * 100).toFixed(4)}%</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'div' && (
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="space-y-4">
            <Input label="Dividend per Share (PKR)" type="number" value={divPerShare} onChange={e => setDivPerShare(e.target.value)} />
            <Input label="Number of Shares" type="number" value={divShares} onChange={e => setDivShares(e.target.value)} />
            <div>
              <Label>ATL Status</Label>
              <div className="flex gap-2 mt-1.5">
                <button onClick={() => setDivIsFiler(true)} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-colors"
                  style={{ background: divIsFiler ? C.posSoft : C.bg, color: divIsFiler ? C.pos : C.muted, border: `1px solid ${divIsFiler ? C.pos : C.border}` }}>
                  Filer (15%)
                </button>
                <button onClick={() => setDivIsFiler(false)} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-colors"
                  style={{ background: !divIsFiler ? C.negSoft : C.bg, color: !divIsFiler ? C.neg : C.muted, border: `1px solid ${!divIsFiler ? C.neg : C.border}` }}>
                  Non-Filer (30%)
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-[14px] font-bold mb-4" style={{ color: C.ink }}>Dividend Summary</div>
            {!divResult ? (
              <div className="p-8 text-center text-[13px]" style={{ color: C.muted }}>Enter dividend details to see tax.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-[14px]">
                  <span style={{ color: C.inkSoft }}>Gross Dividend</span>
                  <span className="font-mono font-bold" style={{ color: C.ink }}>Rs {fmtPKR(divResult.gross)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span style={{ color: C.muted }}>WHT Deducted ({(divResult.rate * 100).toFixed(0)}%)</span>
                  <span className="font-mono font-bold" style={{ color: C.neg }}>- Rs {fmtPKR(divResult.tax)}</span>
                </div>
                <div className="pt-3 border-t flex justify-between text-[16px] font-bold mt-2" style={{ borderColor: C.borderSoft, color: C.pos }}>
                  <span>Net Dividend Received</span>
                  <span className="font-mono">Rs {fmtPKR(divResult.net)}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Static Content / Knowledge Base */}
      <div className="mt-12 space-y-8">
        <h2 className="text-[20px] font-bold border-b pb-3" style={{ color: C.ink, borderColor: C.border }}>Knowledge Base</h2>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-[15px] font-bold mb-3" style={{ color: C.ink }}>How CGT Works on PSX</h3>
            <div className="text-[13px] space-y-3 leading-relaxed" style={{ color: C.muted }}>
              <p><strong>Capital Gains Tax (CGT)</strong> is the tax you pay on the profit made from selling shares. It is automatically computed, collected, and deposited by NCCPL (National Clearing Company of Pakistan Limited).</p>
              <p><strong>FIFO Method:</strong> NCCPL uses the First-In, First-Out (FIFO) method. If you bought 500 shares in Jan and 500 in March, and then sell 500 in May, NCCPL assumes you sold the January shares. This impacts your holding period and tax rate.</p>
              <p><strong>Monthly Cycle:</strong> CGT is netted and collected on a monthly basis. If you make a profit in one trade and a loss in another within the same financial year, the loss offsets the gain.</p>
              <p>You can check your official CGT liabilities by logging into the NCCPL CGT Portal provided by your broker.</p>
            </div>
          </div>
          <div>
            <h3 className="text-[15px] font-bold mb-3" style={{ color: C.ink }}>Filer vs Non-Filer: Why It Matters</h3>
            <div className="text-[13px] space-y-3 leading-relaxed" style={{ color: C.muted }}>
              <p>Being on the Active Taxpayer List (ATL) provides significant tax advantages for investors. Non-filers generally pay double the tax rate on most investments.</p>
              <div className="p-4 rounded-xl mt-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="font-bold text-[12px] mb-2 uppercase tracking-wider" style={{ color: C.ink }}>Example: PKR 100,000 Profit (Bought 2024)</div>
                <div className="flex justify-between py-1">
                  <span>ATL Filer (15%)</span>
                  <span className="font-mono font-bold" style={{ color: C.neg }}>Pays Rs 15,000</span>
                </div>
                <div className="flex justify-between py-1 border-t" style={{ borderColor: C.borderSoft }}>
                  <span>Non-Filer (30%)</span>
                  <span className="font-mono font-bold" style={{ color: C.neg }}>Pays Rs 30,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="mt-16 pt-6 text-center text-[11px] leading-relaxed" style={{ color: C.whisper, borderTop: `1px solid ${C.border}` }}>
        <strong>Disclaimer:</strong> This tool is for educational and estimation purposes only. It does not constitute financial or tax advice. 
        Tax calculations are based on the Income Tax Ordinance, 2001 as amended by the Finance Act 2025. 
        For official CGT computations, refer to <a href="https://nccpl.com.pk/cgt" className="underline hover:text-indigo-400">NCCPL</a>. 
        Consult a qualified tax advisor for your specific situation.
        <div className="mt-2 flex items-center justify-center gap-4">
          <span>Powered by PSX data</span>
          <span>Your data never leaves your browser</span>
        </div>
      </footer>
    </div>
  );
}
