
import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import CurrencyToggle from './CurrencyToggle';
import { Currency } from '../types';
import { ILS_CONVERSION_RATE, CURRENCY_SYMBOLS } from '../constants';

interface AmortizationPoint {
  year: number;
  balance: number;
  interestPaid: number;
  principalPaid: number;
  totalInterest: number;
}

// Mock Data for Historical Rates
const HISTORICAL_FIXED = [
    { 
        label: 'Past 1 Year', 
        t10: { min: 4.2, max: 5.6 },
        t20: { min: 4.7, max: 5.9 },
        t30: { min: 4.9, max: 6.2 },
    },
    { 
        label: 'Past 5 Years', 
        t10: { min: 2.0, max: 5.6 },
        t20: { min: 3.5, max: 5.9 },
        t30: { min: 3.8, max: 6.2 },
    },
    { 
        label: 'Past 10 Years', 
        t10: { min: 1.8, max: 5.6 },
        t20: { min: 2.8, max: 5.9 },
        t30: { min: 3.2, max: 6.2 },
    },
    { 
        label: 'Past 20 Years', 
        t10: { min: 1.8, max: 6.5 },
        t20: { min: 2.8, max: 7.2 },
        t30: { min: 3.2, max: 7.8 },
    },
     { 
        label: 'Past 30 Years', 
        t10: { min: 1.8, max: 8.5 },
        t20: { min: 2.8, max: 9.5 },
        t30: { min: 3.2, max: 11.5 },
    },
];

const HISTORICAL_PRIME = [
    { 
        label: 'Past 1 Year', 
        min: 6.0, max: 6.25
    },
    { 
        label: 'Past 5 Years', 
        min: 1.6, max: 6.25
    },
    { 
        label: 'Past 10 Years', 
        min: 1.6, max: 6.25
    },
    { 
        label: 'Past 20 Years', 
        min: 1.6, max: 6.5
    },
     { 
        label: 'Past 30 Years', 
        min: 1.6, max: 12.0
    },
];

const MortgageCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'risk'>('simulator');
  const [currency, setCurrency] = useState<Currency>('ILS');
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [interestRate, setInterestRate] = useState(4.5);
  const [years, setYears] = useState(30);
  
  // Risk Management State
  const [riskMode, setRiskMode] = useState<'prepayment' | 'variable'>('prepayment');
  const [prepaymentYear, setPrepaymentYear] = useState(5);
  const [marketRateAtPrepayment, setMarketRateAtPrepayment] = useState(3.0);
  
  // Variable Rate Risk State
  const [varUpdateYear, setVarUpdateYear] = useState(5);
  const [varNewRate, setVarNewRate] = useState(6.0);

  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const formatMoney = (val: number) => `${currencySymbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Core Mortgage Calculation
  const { monthlyPayment, totalPayment, totalInterest, amortizationData } = useMemo(() => {
    const r = interestRate / 100 / 12;
    const n = years * 12;
    
    let monthly = 0;
    if (interestRate === 0) {
      monthly = loanAmount / n;
    } else {
      monthly = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalPay = monthly * n;
    const totalInt = totalPay - loanAmount;

    const data: AmortizationPoint[] = [];
    let balance = loanAmount;
    let cumulativeInterest = 0;

    data.push({
        year: 0,
        balance: loanAmount,
        interestPaid: 0,
        principalPaid: 0,
        totalInterest: 0
    });

    for (let year = 1; year <= years; year++) {
      let interestYearly = 0;
      let principalYearly = 0;

      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break;
        const interest = balance * r;
        const principal = monthly - interest;
        balance -= principal;
        interestYearly += interest;
        principalYearly += principal;
      }
      
      cumulativeInterest += interestYearly;

      data.push({
        year,
        balance: Math.max(0, Math.round(balance)),
        interestPaid: Math.round(interestYearly),
        principalPaid: Math.round(principalYearly),
        totalInterest: Math.round(cumulativeInterest),
      });
    }

    return {
      monthlyPayment: monthly,
      totalPayment: totalPay,
      totalInterest: totalInt,
      amortizationData: data
    };
  }, [loanAmount, interestRate, years]);

  // Determine lowest historical rate based on prepayment year and current term
  const getSuggestedMarketRate = useMemo(() => {
    let row = HISTORICAL_FIXED[0];
    if (prepaymentYear <= 1) row = HISTORICAL_FIXED[0];
    else if (prepaymentYear <= 5) row = HISTORICAL_FIXED[1];
    else if (prepaymentYear <= 10) row = HISTORICAL_FIXED[2];
    else if (prepaymentYear <= 20) row = HISTORICAL_FIXED[3];
    else row = HISTORICAL_FIXED[4];

    // Determine which column to look at (10, 20, or 30) based on closest match to current total term
    if (years <= 15) return row.t10.min;
    if (years <= 25) return row.t20.min;
    return row.t30.min;
  }, [prepaymentYear, years]);

  // Auto-update market rate when prepayment year changes (default behavior)
  useEffect(() => {
     setMarketRateAtPrepayment(getSuggestedMarketRate);
  }, [getSuggestedMarketRate]);


  // Risk Calculation: Prepayment Penalty
  const { penalty, remainingBalance, futureSavings } = useMemo(() => {
      const chartPoint = amortizationData.find(d => d.year === Math.round(prepaymentYear));
      const balance = chartPoint ? chartPoint.balance : 0;
      
      if (balance <= 0) return { penalty: 0, remainingBalance: 0, futureSavings: 0 };

      const monthsRemaining = (years * 12) - (Math.round(prepaymentYear) * 12);
      const marketR = marketRateAtPrepayment / 100 / 12;
      
      let pv = 0;
      if (marketRateAtPrepayment === 0) {
          pv = monthlyPayment * monthsRemaining;
      } else {
          pv = monthlyPayment * (1 - Math.pow(1 + marketR, -monthsRemaining)) / marketR;
      }

      const calcPenalty = Math.max(0, pv - balance);
      const totalRemainingPayments = monthlyPayment * monthsRemaining;
      const simpleInterestSaving = totalRemainingPayments - balance;

      return {
          penalty: calcPenalty,
          remainingBalance: balance,
          futureSavings: simpleInterestSaving
      };

  }, [prepaymentYear, years, monthlyPayment, marketRateAtPrepayment, amortizationData]);

  // Risk Calculation: Variable Rate Impact
  const variableRiskData = useMemo(() => {
      const updateYear = Math.round(varUpdateYear);
      const chartPoint = amortizationData.find(d => d.year === updateYear);
      const balance = chartPoint ? chartPoint.balance : 0;
      
      if (balance <= 0) return { newMonthly: 0, newTotal: 0, oldTotal: 0, diff: 0, balance: 0 };

      const remainingMonths = (years * 12) - (updateYear * 12);
      const rNew = varNewRate / 100 / 12;
      
      let newMonthly = 0;
      if (varNewRate === 0) {
          newMonthly = balance / remainingMonths;
      } else {
          newMonthly = (balance * rNew * Math.pow(1 + rNew, remainingMonths)) / (Math.pow(1 + rNew, remainingMonths) - 1);
      }
      
      const newTotal = newMonthly * remainingMonths;
      const oldTotal = monthlyPayment * remainingMonths;
      
      return {
          balance,
          newMonthly,
          newTotal,
          oldTotal,
          diff: newTotal - oldTotal
      };
  }, [amortizationData, varUpdateYear, varNewRate, years, monthlyPayment]);


  return (
    <div>
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
          How good is my mortgage?
        </h1>
        <p className="text-slate-300 mt-2 text-lg">Visualize payments and manage risks.</p>
      </header>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
          <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 inline-flex">
              <button
                  onClick={() => setActiveTab('simulator')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'simulator' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  Simulator
              </button>
              <button
                  onClick={() => setActiveTab('risk')}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'risk' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  Risk Management
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <aside className="lg:col-span-1 bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-slate-700 h-fit">
          <h2 className="text-2xl font-bold mb-6 text-cyan-300">
              {activeTab === 'simulator' ? 'Loan Details' : 'Risk Settings'}
          </h2>
          
          {activeTab === 'simulator' ? (
              <div className="space-y-6">
                <CurrencyToggle selectedCurrency={currency} setCurrency={(c) => {
                    if (c !== currency) {
                        const rate = c === 'ILS' ? ILS_CONVERSION_RATE : 1/ILS_CONVERSION_RATE;
                        setLoanAmount(Math.round(loanAmount * rate));
                    }
                    setCurrency(c);
                }} />

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Loan Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full mt-2 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Loan Term (Years)</label>
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full mt-2 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
          ) : (
              <div className="space-y-6">
                   <div className="flex bg-slate-900/50 p-1 rounded-lg mb-4">
                       <button
                          onClick={() => setRiskMode('prepayment')}
                          className={`flex-1 py-1.5 px-2 text-xs sm:text-sm rounded-md transition-all ${riskMode === 'prepayment' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       >
                           Early Prepayment
                       </button>
                       <button
                          onClick={() => setRiskMode('variable')}
                          className={`flex-1 py-1.5 px-2 text-xs sm:text-sm rounded-md transition-all ${riskMode === 'variable' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       >
                           Rate Increase
                       </button>
                   </div>

                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 mb-6">
                       <p className="text-sm text-slate-400 mb-2">Original Loan</p>
                       <div className="font-mono text-white text-lg">{formatMoney(loanAmount)} @ {interestRate}%</div>
                       <div className="text-xs text-slate-500">{years} years term</div>
                  </div>
                  
                  {riskMode === 'prepayment' ? (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Prepayment after (Years)</label>
                            <input
                                type="number"
                                min="1"
                                max={years - 1}
                                value={prepaymentYear}
                                onChange={(e) => setPrepaymentYear(Math.min(years - 1, Math.max(1, Number(e.target.value))))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                            />
                            <input
                                type="range"
                                min="1"
                                max={years - 1}
                                step="1"
                                value={prepaymentYear}
                                onChange={(e) => setPrepaymentYear(Number(e.target.value))}
                                className="w-full mt-2 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Market Rate at Prepayment (%)
                                <span className="block text-xs font-normal text-slate-500 mt-1">
                                    Defaults to lowest historical rate in last {prepaymentYear} years
                                </span>
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={marketRateAtPrepayment}
                                onChange={(e) => setMarketRateAtPrepayment(Math.max(0, Number(e.target.value)))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                            />
                        </div>
                    </>
                  ) : (
                    <>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Rate updates after (Years)</label>
                            <input
                                type="number"
                                min="1"
                                max={years - 1}
                                value={varUpdateYear}
                                onChange={(e) => setVarUpdateYear(Math.min(years - 1, Math.max(1, Number(e.target.value))))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                            <input
                                type="range"
                                min="1"
                                max={years - 1}
                                step="1"
                                value={varUpdateYear}
                                onChange={(e) => setVarUpdateYear(Number(e.target.value))}
                                className="w-full mt-2 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">New Interest Rate (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={varNewRate}
                                onChange={(e) => setVarNewRate(Math.max(0, Number(e.target.value)))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                             <input
                                type="range"
                                min="0"
                                max="15"
                                step="0.1"
                                value={varNewRate}
                                onChange={(e) => setVarNewRate(Number(e.target.value))}
                                className="w-full mt-2 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    </>
                  )}
              </div>
          )}
        </aside>

        {/* Main Content Section */}
        <main className="lg:col-span-2 space-y-6">
            {activeTab === 'simulator' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-lg">
                            <div className="text-slate-400 text-sm mb-1">Monthly Payment</div>
                            <div className="text-2xl sm:text-3xl font-bold text-cyan-400">{formatMoney(monthlyPayment)}</div>
                        </div>
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-lg">
                            <div className="text-slate-400 text-sm mb-1">Total Interest</div>
                            <div className="text-2xl sm:text-3xl font-bold text-pink-400">{formatMoney(totalInterest)}</div>
                        </div>
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-lg">
                            <div className="text-slate-400 text-sm mb-1">Total Cost</div>
                            <div className="text-2xl sm:text-3xl font-bold text-white">{formatMoney(totalPayment)}</div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-slate-700 h-[400px]">
                        <h3 className="text-xl font-semibold text-slate-300 mb-4">Balance Over Time</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={amortizationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" stroke="#64748b" tick={{fill: '#94a3b8'}} label={{ value: 'Years', position: 'insideBottomRight', offset: -10, fill: '#94a3b8' }} />
                                <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}k`} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#334155', borderColor: '#475569', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                    formatter={(value: number) => formatMoney(value)}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="balance" name="Remaining Balance" stroke="#22d3ee" fillOpacity={1} fill="url(#colorBalance)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 text-slate-300 text-sm">
                        <p>
                        Over <strong>{years} years</strong>, you will pay <strong>{formatMoney(totalInterest)}</strong> in interest on a <strong>{formatMoney(loanAmount)}</strong> loan. 
                        Your total payment will be <strong>{formatMoney(totalPayment)}</strong>.
                        </p>
                    </div>
                </>
            ) : (
                // Risk View
                <div className="space-y-6 h-full">
                     {riskMode === 'prepayment' ? (
                         <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-600 shadow-lg">
                                    <div className="text-slate-400 text-sm mb-2">Outstanding Principal</div>
                                    <div className="text-3xl font-bold text-white">{formatMoney(remainingBalance)}</div>
                                    <div className="text-xs text-slate-500 mt-1">after {prepaymentYear} years</div>
                                </div>
                                <div className={`bg-slate-800/80 p-6 rounded-xl border shadow-lg ${penalty > 0 ? 'border-pink-500/50' : 'border-green-500/50'}`}>
                                    <div className="text-slate-400 text-sm mb-2">Prepayment Penalty</div>
                                    <div className={`text-3xl font-bold ${penalty > 0 ? 'text-pink-500' : 'text-green-400'}`}>
                                        {formatMoney(penalty)}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {penalty > 0 
                                            ? 'Due to market rate < original rate' 
                                            : 'No penalty (Market rate >= Original)'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <h3 className="text-xl font-semibold text-slate-200 mb-4">How is this calculated?</h3>
                                <p className="text-slate-300 mb-4 leading-relaxed">
                                    The penalty estimates the loss to the bank when you repay early. 
                                    If current market interest rates <strong>({marketRateAtPrepayment}%)</strong> are lower than your original rate <strong>({interestRate}%)</strong>, 
                                    the bank loses out on the future interest income they expected from you.
                                </p>
                                
                                <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm text-slate-400 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Remaining Principal:</span>
                                        <span>{formatMoney(remainingBalance)}</span>
                                    </div>
                                    <div className="flex justify-between text-pink-300">
                                        <span>PV of remaining payments @ {marketRateAtPrepayment}%:</span>
                                        <span>{formatMoney(remainingBalance + penalty)}</span>
                                    </div>
                                    <div className="border-t border-slate-700 my-2 pt-2 flex justify-between font-bold text-white">
                                        <span>Penalty (Difference):</span>
                                        <span>{formatMoney(penalty)}</span>
                                    </div>
                                </div>
                            </div>
                         </>
                     ) : (
                         // Variable Rate Risk View
                         <>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-lg">
                                    <div className="text-slate-400 text-sm mb-1">New Monthly Payment</div>
                                    <div className="text-2xl font-bold text-orange-400">{formatMoney(variableRiskData.newMonthly)}</div>
                                    <div className="text-xs text-slate-500">was {formatMoney(monthlyPayment)}</div>
                                </div>
                                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-lg">
                                    <div className="text-slate-400 text-sm mb-1">New Total Remaining</div>
                                    <div className="text-2xl font-bold text-white">{formatMoney(variableRiskData.newTotal)}</div>
                                    <div className="text-xs text-slate-500">Nominal value of remaining payments</div>
                                </div>
                                <div className={`bg-slate-800/80 p-4 rounded-xl border shadow-lg ${variableRiskData.diff > 0 ? 'border-red-500/50' : 'border-green-500/50'}`}>
                                    <div className="text-slate-400 text-sm mb-1">Cost of Increase (Damage)</div>
                                    <div className={`text-2xl font-bold ${variableRiskData.diff > 0 ? 'text-red-500' : 'text-green-400'}`}>
                                        {variableRiskData.diff > 0 ? '+' : ''}{formatMoney(variableRiskData.diff)}
                                    </div>
                                    <div className="text-xs text-slate-500">Diff vs original rate</div>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <h3 className="text-xl font-semibold text-slate-200 mb-4">Understanding Rate Risk</h3>
                                <p className="text-slate-300 mb-4 leading-relaxed">
                                    If you take a variable rate loan (or one that adjusts every {varUpdateYear} years), an increase in interest rates significantly impacts your future payments.
                                </p>
                                
                                <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm text-slate-400 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Remaining Principal at year {varUpdateYear}:</span>
                                        <span>{formatMoney(variableRiskData.balance)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Original Remaining Cost ({interestRate}%):</span>
                                        <span>{formatMoney(variableRiskData.oldTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-orange-300">
                                        <span>New Remaining Cost ({varNewRate}%):</span>
                                        <span>{formatMoney(variableRiskData.newTotal)}</span>
                                    </div>
                                    <div className="border-t border-slate-700 my-2 pt-2 flex justify-between font-bold text-white">
                                        <span>Total Damage:</span>
                                        <span className={variableRiskData.diff > 0 ? 'text-red-400' : 'text-green-400'}>
                                            {formatMoney(variableRiskData.diff)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                         </>
                     )}
                </div>
            )}
        </main>
      </div>

      {/* Historical Rates Table */}
      <div className="mt-8 bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2">
                Historical Rates in Israel
            </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-600 text-slate-400 text-sm">
                <th className="p-3 font-semibold">Time Period</th>
                <th className="p-3 font-semibold text-center">Prime Rate</th>
                <th className="p-3 font-semibold text-center">FNI 10 Years</th>
                <th className="p-3 font-semibold text-center">FNI 20 Years</th>
                <th className="p-3 font-semibold text-center">FNI 30 Years</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {HISTORICAL_FIXED.map((row, index) => {
                  const primeRow = HISTORICAL_PRIME[index];
                  return (
                    <tr key={row.label} className="border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/30 transition-colors">
                        <td className="p-3 font-medium text-cyan-100 whitespace-nowrap">{row.label}</td>
                        
                         {/* Prime Rate Column */}
                        <td className="p-3 text-center font-mono text-sm bg-slate-800/30">
                            <span className="text-green-400">{primeRow.min.toFixed(2)}%</span>
                            <span className="text-slate-500 mx-1">-</span>
                            <span className="text-pink-400">{primeRow.max.toFixed(2)}%</span>
                        </td>

                        <td className="p-3 text-center font-mono text-sm">
                            <span className="text-green-400">{row.t10.min.toFixed(1)}%</span>
                            <span className="text-slate-500 mx-1">-</span>
                            <span className="text-pink-400">{row.t10.max.toFixed(1)}%</span>
                        </td>
                        <td className="p-3 text-center font-mono text-sm">
                            <span className="text-green-400">{row.t20.min.toFixed(1)}%</span>
                            <span className="text-slate-500 mx-1">-</span>
                            <span className="text-pink-400">{row.t20.max.toFixed(1)}%</span>
                        </td>
                        <td className="p-3 text-center font-mono text-sm">
                            <span className="text-green-400">{row.t30.min.toFixed(1)}%</span>
                            <span className="text-slate-500 mx-1">-</span>
                            <span className="text-pink-400">{row.t30.max.toFixed(1)}%</span>
                        </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
         <p className="text-xs text-slate-500 mt-4 italic">
            * Data is for illustrative purposes. FNI = Fixed Non-Indexed ("Kalatz").
        </p>
      </div>
    </div>
  );
};

export default MortgageCalculator;
