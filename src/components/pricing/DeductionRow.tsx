import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeductionField } from '@/hooks/usePricingPresets';

interface DeductionRowProps {
  label: string;
  field: DeductionField;
  preco: number;
  onChange: (field: DeductionField) => void;
}

export const DeductionRow = ({ label, field, preco, onChange }: DeductionRowProps) => {
  const [raisFocused, setRaisFocused] = useState(false);
  const [pctFocused, setPctFocused] = useState(false);
  const [reaisInput, setReaisInput] = useState('');
  const [pctInput, setPctInput] = useState('');

  useEffect(() => {
    if (field.mode === 'reais') {
      setReaisInput(field.val);
      setPctInput(computeToPct(parseFloat(field.val) || 0, preco));
    } else {
      setPctInput(field.val);
      setReaisInput(computeToReais(parseFloat(field.val) || 0, preco));
    }
  }, [field, preco]);

  const computeToReais = (pct: number, price: number): string => {
    const val = (price * pct) / 100;
    return isNaN(val) ? '0' : val.toFixed(2);
  };

  const computeToPct = (reais: number, price: number): string => {
    if (price === 0) return '0';
    const val = (reais / price) * 100;
    return isNaN(val) ? '0' : val.toFixed(2);
  };

  const handleReaisChange = (value: string) => {
    setReaisInput(value);
    const numVal = parseFloat(value) || 0;
    const newPct = computeToPct(numVal, preco);
    setPctInput(newPct);
    onChange({ val: value, mode: 'reais' });
  };

  const handlePctChange = (value: string) => {
    setPctInput(value);
    const numVal = parseFloat(value) || 0;
    const newReais = computeToReais(numVal, preco);
    setReaisInput(newReais);
    onChange({ val: value, mode: 'pct' });
  };

  const handleReaisFocus = () => {
    setRaisFocused(true);
    if (field.mode !== 'reais') {
      setReaisInput(field.val);
      onChange({ val: field.val, mode: 'reais' });
    }
  };

  const handleReaisBlur = () => {
    setRaisFocused(false);
  };

  const handlePctFocus = () => {
    setPctFocused(true);
    if (field.mode !== 'pct') {
      setPctInput(field.val);
      onChange({ val: field.val, mode: 'pct' });
    }
  };

  const handlePctBlur = () => {
    setPctFocused(false);
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-end pb-4 border-b border-border last:border-b-0">
      <div className="col-span-4">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
      </div>

      <div className="col-span-4">
        <Label className="text-xs text-muted-foreground mb-1 block">R$</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={reaisInput}
          onChange={(e) => handleReaisChange(e.target.value)}
          onFocus={handleReaisFocus}
          onBlur={handleReaisBlur}
          readOnly={!raisFocused && field.mode !== 'reais'}
          className={!raisFocused && field.mode !== 'reais' ? 'bg-muted/30 text-muted-foreground' : ''}
        />
      </div>

      <div className="col-span-4">
        <Label className="text-xs text-muted-foreground mb-1 block">%</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={pctInput}
          onChange={(e) => handlePctChange(e.target.value)}
          onFocus={handlePctFocus}
          onBlur={handlePctBlur}
          readOnly={!pctFocused && field.mode !== 'pct'}
          className={!pctFocused && field.mode !== 'pct' ? 'bg-muted/30 text-muted-foreground' : ''}
        />
      </div>
    </div>
  );
};
