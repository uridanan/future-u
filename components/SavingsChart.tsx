import React from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Legend } from 'recharts';
import { ChartDataPoint, Scenario } from '../types';

interface SavingsChartProps {
  data: ChartDataPoint[];
  scenarios: Scenario[];
  colors: string[];
  currencySymbol: string;
}

const formatValue = (value: number, symbol: string): string => {
  if (value >= 1_000_000) {
    return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${symbol}${(value / 1_000).toFixed(0)}k`;
  }
  return `${symbol}${value}`;
};

const CustomTooltip = ({ active, payload, label, currencySymbol, scenarios, colors }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-700 p-3 rounded-lg border border-slate-600 shadow-lg">
        <p className="label text-slate-300 mb-2">{`Age: ${label}`}</p>
        {payload.map((pld: any) => {
          const scenario = scenarios.find((s: Scenario) => s.id === pld.dataKey);
          if (!scenario) return null;

          // Don't render a line in the tooltip for a scenario that hasn't started yet
          if (pld.value === null || pld.value === undefined) {
            return null;
          }
          
          const scenarioIndex = scenarios.findIndex((s: Scenario) => s.id === pld.dataKey);
          const color = colors[scenarioIndex % colors.length];

          return (
            <div key={pld.dataKey} style={{ color }}>
              {`${scenario.name}: ${currencySymbol}${pld.value.toLocaleString()}`}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const SavingsChart: React.FC<SavingsChartProps> = ({ data, scenarios, colors, currencySymbol }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          {scenarios.map((scenario, index) => (
            <linearGradient key={scenario.id} id={`color-${scenario.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
        <XAxis 
          dataKey="age" 
          tick={{ fill: '#94a3b8' }} 
          stroke="#64748b"
          label={{ value: 'Age', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
        />
        <YAxis
          tickFormatter={(tick) => formatValue(tick, currencySymbol)}
          tick={{ fill: '#94a3b8' }}
          stroke="#64748b"
          width={80}
        />
        <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} scenarios={scenarios} colors={colors} />} />
        <Legend />
        {scenarios.map((scenario, index) => (
          <Area 
            key={scenario.id}
            type="monotone" 
            dataKey={scenario.id} 
            name={scenario.name}
            stroke={colors[index % colors.length]} 
            fillOpacity={1} 
            fill={`url(#color-${scenario.id})`}
            strokeWidth={2}
            connectNulls={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SavingsChart;