
import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, id = "toggle-switch" }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer group">
      <span className="mr-3 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
      <div className="relative">
        <input 
          type="checkbox" 
          id={id}
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-12 h-6 rounded-full transition-colors ${checked ? 'bg-pink-500' : 'bg-slate-700'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
