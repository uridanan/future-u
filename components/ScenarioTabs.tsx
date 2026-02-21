import React, { useState, useEffect, useRef } from 'react';
import { Scenario } from '../types';
import { PlusIcon, PencilIcon } from './icons';

interface ScenarioTabsProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  colors: string[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

const ScenarioTabs: React.FC<ScenarioTabsProps> = ({ scenarios, activeScenarioId, colors, onSelect, onAdd, onRemove, onRename }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const handleStartEditing = (scenario: Scenario) => {
    setEditingId(scenario.id);
    setEditingName(scenario.name);
  };

  const handleFinishEditing = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEditing();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div>
       <h2 className="text-2xl font-bold mb-4 text-purple-300">Compare Scenarios</h2>
      <div className="flex items-center border-b border-slate-700">
        <div className="flex-grow flex items-center gap-1">
          {scenarios.map((scenario, index) => {
            const isActive = scenario.id === activeScenarioId;
            const color = colors[index % colors.length];
            return (
              <div
                key={scenario.id}
                className={`relative px-4 py-2 rounded-t-lg cursor-pointer group transition-colors ${isActive ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
                style={isActive ? { borderBottom: `2px solid ${color}` } : {}}
                onClick={() => onSelect(scenario.id)}
              >
                {editingId === scenario.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleFinishEditing}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-b-2 border-purple-400 outline-none text-white"
                    style={{width: `${editingName.length + 2}ch`}}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300" style={isActive ? { color: 'white' } : {}}>{scenario.name}</span>
                    <button
                      onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditing(scenario);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity"
                      aria-label={`Rename ${scenario.name}`}
                    >
                      <PencilIcon />
                    </button>
                  </div>
                )}
                 {scenarios.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(scenario.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                 )}
              </div>
            );
          })}
        </div>
        <button
          onClick={onAdd}
          className="ml-2 p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          aria-label="Add new scenario"
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  );
};

export default ScenarioTabs;