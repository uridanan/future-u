
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Contribution, Currency, ChartDataPoint, Scenario, MilestoneRow } from '../types';
import { ILS_CONVERSION_RATE, MILESTONE_AGES, CURRENCY_SYMBOLS, SCENARIO_COLORS } from '../constants';
import SavingsChart from './SavingsChart';
import CurrencyToggle from './CurrencyToggle';
import ContributionInput from './ContributionInput';
import { PlusIcon } from './icons';
import ScenarioTabs from './ScenarioTabs';
import MilestoneTable from './MilestoneTable';
import ToggleSwitch from './ToggleSwitch';

// Simple ID generator
const generateId = () => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

const createNewScenario = (name: string): Scenario => ({
  id: generateId(),
  name,
  initialAmount: 1000,
  startAge: 20,
  interestRate: 10,
  contributions: [{ id: generateId(), fromAge: 20, toAge: 65, amount: 500 }],
});

const SavingsCalculator: React.FC = () => {
  const [currency, setCurrency] = useState<Currency>('ILS');
  const [scenarios, setScenarios] = useState<Scenario[]>([createNewScenario('Scenario 1')]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0].id);
  
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [milestoneData, setMilestoneData] = useState<MilestoneRow[]>([]);
  const [showMonthlyAllowance, setShowMonthlyAllowance] = useState(false);

  const activeScenario = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId) || scenarios[0],
    [scenarios, activeScenarioId]
  );
  
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  
  const calculateAllScenarios = useCallback(() => {
    const dataByAge: { [age: number]: { [scenarioId: string]: number } } = {};
    const maxAge = 70;
    const conversionRate = currency === 'ILS' ? ILS_CONVERSION_RATE : 1;

    scenarios.forEach(scenario => {
      if (scenario.startAge >= maxAge) return;

      let currentBalanceUSD = Number(scenario.initialAmount);
      const monthlyInterestRate = scenario.interestRate / 100 / 12;

      if (!dataByAge[scenario.startAge]) dataByAge[scenario.startAge] = {};
      dataByAge[scenario.startAge][scenario.id] = Math.round(currentBalanceUSD * conversionRate);

      for (let age = scenario.startAge; age < maxAge; age++) {
        const monthlyContributionUSD = scenario.contributions
          .filter(c => age >= c.fromAge && age < c.toAge)
          .reduce((total, c) => total + Number(c.amount), 0);
        
        for (let month = 1; month <= 12; month++) {
          currentBalanceUSD += monthlyContributionUSD;
          currentBalanceUSD *= (1 + monthlyInterestRate);
        }
        
        const nextAge = age + 1;
        if (!dataByAge[nextAge]) dataByAge[nextAge] = {};
        dataByAge[nextAge][scenario.id] = Math.round(currentBalanceUSD * conversionRate);
      }
    });

    const fullChartData: ChartDataPoint[] = [];
    const minStartAge = scenarios.length > 0 
      ? Math.min(...scenarios.map(s => s.startAge)) 
      : 0;

    const lastValues: { [scenarioId: string]: number | null } = {};
    scenarios.forEach(s => { lastValues[s.id] = null; });

    for (let age = minStartAge; age <= maxAge; age++) {
      const record: ChartDataPoint = { age };
      scenarios.forEach(s => {
        if (age < s.startAge) {
          record[s.id] = null;
        } else {
          const currentVal = dataByAge[age]?.[s.id];
          if (currentVal !== undefined) {
            lastValues[s.id] = currentVal;
          }
          record[s.id] = lastValues[s.id];
        }
      });
      fullChartData.push(record);
    }
    
    setChartData(fullChartData);
    
    const newMilestoneData = MILESTONE_AGES.map(age => {
      const dataPoint = fullChartData.find(d => d.age === age);
      const milestoneRow: MilestoneRow = { age, values: {} };
      scenarios.forEach(s => {
        const total = dataPoint ? (dataPoint[s.id] ?? null) : null;
        let allowance: number | null = null;
        if (total !== null) {
          const monthlyInterestRate = s.interestRate / 100 / 12;
          const incomeTaxRate = 0.28;
          allowance = Math.round(total * monthlyInterestRate * (1 - incomeTaxRate));
        }
        milestoneRow.values[s.id] = { total, allowance };
      });
      return milestoneRow;
    });
    setMilestoneData(newMilestoneData);

  }, [scenarios, currency]);

  useEffect(() => {
    calculateAllScenarios();
  }, [calculateAllScenarios]);

  const updateActiveScenario = (field: keyof Omit<Scenario, 'id' | 'contributions'>, value: any) => {
    setScenarios(scenarios.map(s => 
      s.id === activeScenarioId ? { ...s, [field]: value } : s
    ));
  };
  
  const addScenario = () => {
    const newScenario = createNewScenario(`Scenario ${scenarios.length + 1}`);
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newScenario.id);
  };
  
  const removeScenario = (idToRemove: string) => {
    if (scenarios.length <= 1) return;
    const newScenarios = scenarios.filter(s => s.id !== idToRemove);
    setScenarios(newScenarios);
    if (activeScenarioId === idToRemove) {
      setActiveScenarioId(newScenarios[0].id);
    }
  };
  
  const renameScenario = (id: string, newName: string) => {
    setScenarios(scenarios.map(s => s.id === id ? { ...s, name: newName } : s));
  };
  
  const addContribution = () => {
    const lastContribution = activeScenario.contributions[activeScenario.contributions.length - 1];
    const newFromAge = lastContribution ? lastContribution.toAge : activeScenario.startAge;
    const newContribution: Contribution = { id: generateId(), fromAge: newFromAge, toAge: newFromAge + 10, amount: 500 };
    setScenarios(scenarios.map(s => 
      s.id === activeScenarioId ? { ...s, contributions: [...s.contributions, newContribution] } : s
    ));
  };

  const updateContribution = (id: string, field: keyof Contribution, value: string) => {
    const newContributions = activeScenario.contributions.map(c => {
      if (c.id !== id) return c;
      const isAmount = field === 'amount';
      let numericValue = isAmount ? parseFloat(value) : parseInt(value, 10);
      if (isNaN(numericValue)) numericValue = 0;
      
      if (isAmount && currency === 'ILS') {
        numericValue /= ILS_CONVERSION_RATE;
      }
      return { ...c, [field]: numericValue };
    });
    setScenarios(scenarios.map(s => 
      s.id === activeScenarioId ? { ...s, contributions: newContributions } : s
    ));
  };
  
  const removeContribution = (id: string) => {
    if (activeScenario.contributions.length > 1) {
      const newContributions = activeScenario.contributions.filter(c => c.id !== id);
      setScenarios(scenarios.map(s => 
        s.id === activeScenarioId ? { ...s, contributions: newContributions } : s
      ));
    }
  };
  
  const handleInitialAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let value = rawValue === '' ? 0 : parseFloat(rawValue);
    if (isNaN(value)) value = 0;

    if (currency === 'ILS') {
      value /= ILS_CONVERSION_RATE;
    }
    updateActiveScenario('initialAmount', value);
  };
  
  const displayInitialAmount = currency === 'USD' 
    ? activeScenario.initialAmount 
    : parseFloat((activeScenario.initialAmount * ILS_CONVERSION_RATE).toFixed(2));

  return (
    <div>
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          The Power of Compound Interest
        </h1>
        <p className="text-slate-300 mt-2 text-lg">Compare savings plans and see the magic of compounding!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <aside className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-slate-700">
          <ScenarioTabs
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            onSelect={setActiveScenarioId}
            onAdd={addScenario}
            onRemove={removeScenario}
            onRename={renameScenario}
            colors={SCENARIO_COLORS}
          />
          <div className="space-y-6 mt-6">
            <CurrencyToggle selectedCurrency={currency} setCurrency={setCurrency} />

            <div>
              <label htmlFor="initialAmount" className="block text-sm font-medium text-slate-300 mb-2">Initial Nest Egg ({currencySymbol})</label>
              <input
                type="number"
                id="initialAmount"
                value={activeScenario.initialAmount > 0 ? displayInitialAmount : ''}
                onChange={handleInitialAmountChange}
                placeholder="0"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="startAge" className="block text-sm font-medium text-slate-300 mb-2">Starting Age</label>
              <input
                type="number"
                id="startAge"
                value={activeScenario.startAge}
                onChange={(e) => updateActiveScenario('startAge', parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-slate-300 mb-2">Annual Interest Rate (%)</label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  id="interestRate"
                  min="0"
                  max="20"
                  step="0.5"
                  value={activeScenario.interestRate}
                  onChange={(e) => updateActiveScenario('interestRate', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-semibold text-purple-300 w-16 text-center">{activeScenario.interestRate.toFixed(1)}%</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-300 mb-3">Monthly Contributions</h3>
              <div className="space-y-4">
                {activeScenario.contributions.map((c) => {
                  const contributionForDisplay = {
                    ...c,
                    amount: currency === 'ILS' ? parseFloat((c.amount * ILS_CONVERSION_RATE).toFixed(2)) : c.amount
                  };
                  return (
                    <ContributionInput
                      key={c.id}
                      contribution={contributionForDisplay}
                      currencySymbol={currencySymbol}
                      onUpdate={updateContribution}
                      onRemove={removeContribution}
                      isRemovable={activeScenario.contributions.length > 1}
                    />
                  );
                })}
              </div>
              <button
                onClick={addContribution}
                className="mt-4 w-full flex items-center justify-center gap-2 text-purple-300 font-semibold py-2 px-4 rounded-lg border-2 border-dashed border-slate-600 hover:bg-slate-700 hover:border-purple-500 transition-all"
              >
                <PlusIcon /> Add Saving Period
              </button>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <section className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-pink-400">Your Future Nest Egg</h2>
              <ToggleSwitch
                label="Show Monthly Allowance"
                checked={showMonthlyAllowance}
                onChange={setShowMonthlyAllowance}
                id="allowance-toggle"
              />
            </div>
            <MilestoneTable 
              milestones={milestoneData} 
              scenarios={scenarios} 
              currencySymbol={currencySymbol} 
              colors={SCENARIO_COLORS}
              showMonthlyAllowance={showMonthlyAllowance}
            />
            <div className="h-96 w-full mt-8">
              <SavingsChart data={chartData} currencySymbol={currencySymbol} scenarios={scenarios} colors={SCENARIO_COLORS} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SavingsCalculator;
