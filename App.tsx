
import React, { useState } from 'react';
import SavingsCalculator from './components/SavingsCalculator';
import MortgageCalculator from './components/MortgageCalculator';
import { PiggyBankIcon, HomeIcon, ChevronLeftIcon, ChevronRightIcon } from './components/icons';

interface NavButtonProps {
    active: boolean;
    collapsed: boolean;
    onClick: () => void;
    icon: React.ReactElement<{ className?: string }>;
    label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, collapsed, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`
            w-full flex items-center rounded-xl transition-all duration-200 group
            ${active 
                ? 'bg-slate-800/90 text-white shadow-lg shadow-purple-500/10 border border-slate-700/50' 
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }
            ${collapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3'}
        `}
        title={collapsed ? label : undefined}
    >
        <span className={`${active ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'} transition-colors`}>
            {React.cloneElement(icon, { className: "w-6 h-6" })}
        </span>
        
        {!collapsed && (
            <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis text-sm sm:text-base">
                {label}
            </span>
        )}
        
        {active && !collapsed && (
             <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
        )}
    </button>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'savings' | 'mortgages'>('savings');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-indigo-900 font-sans text-white overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        } bg-slate-900/80 backdrop-blur-md border-r border-slate-700 transition-all duration-300 flex flex-col relative z-20 shadow-xl`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-9 bg-slate-700 border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-600 rounded-full p-1.5 shadow-lg z-50 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
            {isSidebarCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>

        {/* Logo / Header */}
        <div className={`h-24 flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'px-6'}`}>
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/20">
                    F
                </div>
                <div className={`font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-300 origin-left ${isSidebarCollapsed ? 'opacity-0 w-0 scale-0 hidden' : 'opacity-100 w-auto scale-100'}`}>
                    Future U
                </div>
            </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-2">
            <NavButton 
                active={currentPage === 'savings'}
                collapsed={isSidebarCollapsed}
                onClick={() => setCurrentPage('savings')}
                icon={<PiggyBankIcon />}
                label="Savings"
            />
            <NavButton 
                active={currentPage === 'mortgages'}
                collapsed={isSidebarCollapsed}
                onClick={() => setCurrentPage('mortgages')}
                icon={<HomeIcon />}
                label="Mortgages"
            />
        </nav>

        {/* Footer info */}
        <div className={`p-4 border-t border-slate-800 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
            <div className="text-xs text-slate-500 text-center">
                © 2025 Finance Fun
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
         <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-full">
             {currentPage === 'savings' ? <SavingsCalculator /> : <MortgageCalculator />}
         </div>
      </main>
    </div>
  );
};

export default App;
