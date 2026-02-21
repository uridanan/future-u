
import React from 'react';
import { MilestoneRow, Scenario } from '../types';

interface MilestoneTableProps {
  milestones: MilestoneRow[];
  scenarios: Scenario[];
  colors: string[];
  currencySymbol: string;
  showMonthlyAllowance: boolean;
}

const MilestoneTable: React.FC<MilestoneTableProps> = ({ milestones, scenarios, colors, currencySymbol, showMonthlyAllowance }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-600">
            <th className="p-2 font-semibold text-slate-400">Milestone</th>
            {scenarios.map((scenario, index) => (
              <th 
                key={scenario.id} 
                className="p-2 font-semibold text-right"
                style={{ color: colors[index % colors.length] }}
              >
                {scenario.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {milestones.map((milestone) => (
            <tr key={milestone.age} className="border-b border-slate-700 last:border-b-0">
              <td className="p-2 text-slate-300">Age {milestone.age}</td>
              {scenarios.map((scenario) => {
                const data = milestone.values[scenario.id];
                const total = data?.total;
                const allowance = data?.allowance;
                return (
                  <td key={scenario.id} className="p-2 text-right font-mono text-white">
                    {total !== null && total !== undefined
                      ? (
                        <div>
                          <span>{`${currencySymbol}${total.toLocaleString()}`}</span>
                          {showMonthlyAllowance && allowance !== null && allowance !== undefined && (
                            <span className="block text-sm text-pink-300/80 font-sans">
                              {`${currencySymbol}${allowance.toLocaleString()}`}/mo
                            </span>
                          )}
                        </div>
                        )
                      : 'N/A'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MilestoneTable;