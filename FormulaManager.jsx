import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Play, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { validateFormula } from '@/lib/formulaEngine';

export const FORMULA_COLORS = [
  '#39a0ff', '#ff6b6b', '#51cf66', '#ffd43b', '#cc5de8', '#ff922b', '#20c997', '#f06595'
];

function FormulaRow({ entry, index, availableVars, onChange, onRemove, onRun, onSave, canRemove }) {
  const [showVars, setShowVars] = useState(false);
  const validation = entry.formula.trim() ? validateFormula(entry.formula, availableVars) : { valid: true };
  const isValid = validation.valid && entry.formula.trim();

  const insertAtEnd = (v) => {
    onChange({ ...entry, formula: entry.formula ? `${entry.formula} ${v}` : v });
  };

  return (
    <div
      className="rounded-lg p-2.5 space-y-2"
      style={{
        background: 'linear-gradient(160deg, hsl(220,14%,13%) 0%, hsl(220,12%,11%) 100%)',
        border: `1px solid ${entry.color}33`,
        boxShadow: `inset 0 1px 0 ${entry.color}15`,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Color dot */}
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}80` }} />
        <input
          value={entry.label}
          onChange={e => onChange({ ...entry, label: e.target.value })}
          placeholder={`Formula ${index + 1}`}
          className="flex-1 min-w-0 bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground/40 border-none outline-none"
        />
        {canRemove && (
          <button onClick={onRemove} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-2 items-start">
        <textarea
          value={entry.formula}
          onChange={e => onChange({ ...entry, formula: e.target.value })}
          placeholder="e.g. cape * (temperature_2m / 100)"
          rows={2}
          className="flex-1 font-mono text-xs resize-none rounded-md px-2.5 py-2 leading-relaxed focus:outline-none focus:ring-1"
          style={{
            background: 'hsl(220,15%,9%)',
            border: `1px solid ${isValid ? 'hsl(215,18%,22%)' : 'hsl(0,70%,40%)'}`,
            color: 'hsl(210,25%,88%)',
            minHeight: 52,
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && isValid) { e.preventDefault(); onRun(); }
          }}
        />
        <div className="flex flex-col gap-1">
          <button
            onClick={onRun}
            disabled={!isValid}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-30"
            style={isValid ? {
              background: 'linear-gradient(160deg, hsl(195,55%,38%) 0%, hsl(200,50%,28%) 100%)',
              boxShadow: `0 0 8px ${entry.color}40`,
            } : { background: 'hsl(220,12%,18%)' }}
          >
            <Play className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={onSave}
            disabled={!isValid}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: 'hsl(220,12%,18%)', border: '1px solid hsl(215,18%,24%)' }}
          >
            <Save className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {!validation.valid && entry.formula.trim() && (
        <p className="text-destructive text-[10px]">{validation.error}</p>
      )}

      {availableVars.length > 0 && (
        <div className="space-y-1">
          <button
            onClick={() => setShowVars(v => !v)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {showVars ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Variables ({availableVars.length})
          </button>
          {showVars && (
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {availableVars.map(v => (
                <button
                  key={v}
                  onClick={() => insertAtEnd(v)}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono transition-all hover:opacity-80"
                  style={{ background: 'hsl(220,12%,16%)', border: '1px solid hsl(215,18%,22%)', color: entry.color }}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FormulaManager({ formulas, onFormulasChange, availableVars, onRunAll, onSave }) {
  const addFormula = () => {
    const color = FORMULA_COLORS[formulas.length % FORMULA_COLORS.length];
    onFormulasChange([...formulas, { id: Date.now(), label: '', formula: '', color, results: null, stats: null }]);
  };

  const updateFormula = (id, updates) => {
    onFormulasChange(formulas.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFormula = (id) => {
    onFormulasChange(formulas.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-2">
      {formulas.map((entry, i) => (
        <FormulaRow
          key={entry.id}
          entry={entry}
          index={i}
          availableVars={availableVars}
          onChange={(updates) => updateFormula(entry.id, updates)}
          onRemove={() => removeFormula(entry.id)}
          onRun={() => onRunAll(entry.id)}
          onSave={() => onSave(entry)}
          canRemove={formulas.length > 1}
        />
      ))}
      <button
        onClick={addFormula}
        className="w-full h-8 rounded-md flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all"
        style={{ background: 'hsl(220,12%,13%)', border: '1px dashed hsl(215,18%,22%)' }}
      >
        <Plus className="w-3.5 h-3.5" /> Add Formula
      </button>
    </div>
  );
}