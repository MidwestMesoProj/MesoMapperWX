import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Play, AlertCircle, CheckCircle2, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { validateFormula } from '@/lib/formulaEngine';

const MATH_OPS = [
  { label: '+', insert: ' + ' },
  { label: '−', insert: ' - ' },
  { label: '×', insert: ' * ' },
  { label: '÷', insert: ' / ' },
  { label: '^', insert: ' ^ ' },
  { label: '( )', insert: '()' },
  { label: 'sqrt()', insert: 'sqrt()' },
  { label: 'abs()', insert: 'abs()' },
  { label: 'min()', insert: 'min()' },
  { label: 'max()', insert: 'max()' },
  { label: 'log()', insert: 'log()' },
  { label: 'round()', insert: 'round()' },
  { label: 'pow()', insert: 'pow()' },
  { label: 'floor()', insert: 'floor()' },
  { label: 'ceil()', insert: 'ceil()' },
];

export default function FormulaInput({ formula, onFormulaChange, onExecute, onSave, isEvaluating, availableVars }) {
  const [validation, setValidation] = useState({ valid: true });
  const [showVars, setShowVars] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (formula.trim()) {
      setValidation(validateFormula(formula, availableVars));
    } else {
      setValidation({ valid: true });
    }
  }, [formula, availableVars]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newH = Math.min(Math.max(el.scrollHeight, 56), 200);
    el.style.height = `${newH}px`;
  }, [formula]);

  const insertAtCursor = (text) => {
    const el = textareaRef.current;
    if (!el) {
      onFormulaChange(formula + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = formula.slice(0, start) + text + formula.slice(end);
    onFormulaChange(newVal);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const isValid = validation.valid && formula.trim();

  return (
    <div className="space-y-2">
      {/* Textarea + run/save buttons */}
      <div className="flex gap-2 items-start">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={formula}
            onChange={(e) => onFormulaChange(e.target.value)}
            placeholder="e.g.  cape * (temperature_2m / 100)&#10;  wind_gusts_10m - wind_speed_10m&#10;  sqrt(cape) * lifted_index"
            rows={2}
            className="w-full font-mono text-sm resize-none overflow-hidden rounded-lg px-3 py-2.5 pr-9
              metal-surface border border-border/50 text-foreground placeholder:text-muted-foreground/50
              focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40
              leading-relaxed transition-all"
            style={{ minHeight: 56 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && validation.valid && formula.trim()) {
                e.preventDefault();
                onExecute();
              }
            }}
          />
          <div className="absolute right-2.5 top-2.5">
            {formula.trim() && (
              validation.valid
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            onClick={onExecute}
            disabled={!isValid || isEvaluating}
            className="h-10 px-4 shrink-0 font-semibold metal-button border-0 text-foreground hover:text-white"
            style={{
              background: isValid && !isEvaluating
                ? 'linear-gradient(160deg, hsl(195,55%,38%) 0%, hsl(200,50%,28%) 50%, hsl(195,55%,34%) 100%)'
                : undefined,
              boxShadow: isValid && !isEvaluating
                ? 'inset 0 1px 0 hsl(195,60%,52%), 0 0 10px hsl(195,60%,40%/0.3)'
                : undefined,
            }}
          >
            {isEvaluating
              ? <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              : <Play className="w-4 h-4" />
            }
            <span className="ml-1.5 hidden sm:inline text-xs">Run</span>
          </Button>
          <Button
            onClick={onSave}
            variant="outline"
            disabled={!isValid}
            className="h-8 px-3 border-border/40 metal-chip shrink-0 text-xs text-muted-foreground hover:text-foreground"
            title="Save formula (Ctrl+Enter to run)"
          >
            <Save className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground/60 font-mono">Ctrl+Enter to run &nbsp;·&nbsp; click variables below to insert</p>

      {/* Math operator buttons */}
      <div className="flex flex-wrap gap-1">
        {MATH_OPS.map((op) => (
          <button
            key={op.label}
            onClick={() => insertAtCursor(op.insert)}
            className="px-2.5 py-1 rounded text-xs font-mono metal-chip hover:border-accent/40 hover:text-accent transition-all"
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Variable chips */}
      {availableVars.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Variables ({availableVars.length})
            </span>
            {availableVars.length > 12 && (
              <button
                onClick={() => setShowVars(v => !v)}
                className="text-[10px] text-accent flex items-center gap-0.5 hover:text-accent/80"
              >
                {showVars ? <><ChevronUp className="w-3 h-3" /> less</> : <><ChevronDown className="w-3 h-3" /> show all</>}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {(showVars || availableVars.length <= 12 ? availableVars : availableVars.slice(0, 12)).map(v => (
              <button
                key={v}
                onClick={() => insertAtCursor(` ${v}`)}
                title={`Insert: ${v}`}
                className="px-2 py-0.5 rounded text-[10px] font-mono metal-chip hover:border-accent/40 hover:text-accent transition-all max-w-[160px] truncate"
              >
                {v}
              </button>
            ))}
            {!showVars && availableVars.length > 12 && (
              <button
                onClick={() => setShowVars(true)}
                className="px-2 py-0.5 rounded text-[10px] text-muted-foreground metal-chip border-border/20 hover:text-foreground"
              >
                +{availableVars.length - 12} more
              </button>
            )}
          </div>
        </div>
      )}

      {!validation.valid && formula.trim() && (
        <p className="text-destructive text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {validation.error}
        </p>
      )}
    </div>
  );
}