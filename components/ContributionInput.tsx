import React from 'react';
import { Contribution } from '../types';
import { TrashIcon } from './icons';

interface ContributionInputProps {
  contribution: Contribution;
  currencySymbol: string;
  onUpdate: (id: string, field: keyof Contribution, value: string) => void;
  onRemove: (id: string) => void;
  isRemovable: boolean;
}

const ContributionInput: React.FC<ContributionInputProps> = ({ contribution, currencySymbol, onUpdate, onRemove, isRemovable }) => {
  const { id, fromAge, toAge, amount } = contribution;
  
  const commonInputClasses = "w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-white focus:ring-1 focus:ring-purple-500 focus:outline-none";

  return (
    <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-700">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400">Amount ({currencySymbol}/mo)</label>
          <input
            type="number"
            value={amount > 0 ? amount : ''}
            onChange={(e) => onUpdate(id, 'amount', e.target.value)}
            placeholder="0"
            className={commonInputClasses}
          />
        </div>
        <div className="sm:col-span-2 flex gap-2 items-center">
          <div className="flex-1">
            <label className="text-xs text-slate-400">From Age</label>
            <input
              type="number"
              value={fromAge}
              onChange={(e) => onUpdate(id, 'fromAge', e.target.value)}
              className={commonInputClasses}
            />
          </div>
           <span className="text-slate-400 pt-5"> - </span>
          <div className="flex-1">
            <label className="text-xs text-slate-400">To Age</label>
            <input
              type="number"
              value={toAge}
              onChange={(e) => onUpdate(id, 'toAge', e.target.value)}
              className={commonInputClasses}
            />
          </div>
        </div>
        <div className="sm:col-span-1 flex justify-end sm:justify-center">
           {isRemovable && (
            <button
              onClick={() => onRemove(id)}
              className="p-2 h-10 w-10 flex items-center justify-center bg-slate-700 rounded-md text-slate-400 hover:bg-red-500 hover:text-white transition-colors"
              aria-label="Remove contribution period"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContributionInput;