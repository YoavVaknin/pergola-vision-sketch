
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Point } from '@/types/pergola';

interface DimensionEditorProps {
  visible: boolean;
  position: Point;
  currentValue: number;
  unit: string;
  onSubmit: (newValue: number) => void;
  onCancel: () => void;
}

export const DimensionEditor: React.FC<DimensionEditorProps> = ({
  visible,
  position,
  currentValue,
  unit,
  onSubmit,
  onCancel
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      setValue(currentValue.toFixed(1));
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [visible, currentValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newValue = parseFloat(value);
    if (!isNaN(newValue) && newValue > 0) {
      onSubmit(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!visible) return null;

  return (
    <div 
      className="absolute z-50 bg-white border rounded-md shadow-lg p-2"
      style={{
        left: position.x,
        top: position.y - 50,
        transform: 'translateX(-50%)'
      }}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-24 h-8 text-sm"
          step="0.1"
          min="0.1"
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </form>
      <div className="text-xs text-muted-foreground mt-1 text-center">
        Enter לאישור, Esc לביטול
      </div>
    </div>
  );
};
