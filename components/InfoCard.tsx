
import React from 'react';

interface InfoCardProps {
  age: number;
  amount: number | null;
  currencySymbol: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ age, amount, currencySymbol }) => {
  const formattedAmount = amount !== null 
    ? `${currencySymbol}${amount.toLocaleString()}`
    : 'N/A';

  return (
    <div className="bg-slate-700/50 p-3 rounded-lg text-center border border-slate-600 hover:border-pink-500 transition-colors">
      <p className="text-sm text-slate-400">At Age {age}</p>
      <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-400">
        {formattedAmount}
      </p>
    </div>
  );
};

export default InfoCard;
