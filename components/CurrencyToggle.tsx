
import React from 'react';
import { Currency } from '../types';

interface CurrencyToggleProps {
  selectedCurrency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ selectedCurrency, setCurrency }) => {
  const commonButtonClasses = "w-1/2 py-2 px-4 rounded-lg font-semibold transition-all duration-300";
  const activeButtonClasses = "bg-purple-600 text-white shadow-md";
  const inactiveButtonClasses = "bg-slate-700 text-slate-300 hover:bg-slate-600";

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
      <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-600">
        <button
          onClick={() => setCurrency('USD')}
          className={`${commonButtonClasses} ${selectedCurrency === 'USD' ? activeButtonClasses : inactiveButtonClasses}`}
        >
          USD ($)
        </button>
        <button
          onClick={() => setCurrency('ILS')}
          className={`${commonButtonClasses} ${selectedCurrency === 'ILS' ? activeButtonClasses : inactiveButtonClasses}`}
        >
          ILS (₪)
        </button>
      </div>
    </div>
  );
};

export default CurrencyToggle;
