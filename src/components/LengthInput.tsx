
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Point } from '@/types/pergola';

interface LengthInputProps {
  visible: boolean;
  position: Point;
  onSubmit: (length: number) => void;
  onCancel: () => void;
  currentLength: number;
  unit: string;
}

export const LengthInput: React.FC<LengthInputProps> = ({
  visible,
  position,
  onSubmit,
  onCancel,
  currentLength,
  unit
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      setValue(currentLength.toFixed(1));
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [visible, currentLength]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const length = parseFloat(value);
    if (!isNaN(length) && length > 0) {
      onSubmit(length);
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
        left: position.x + 10,
        top: position.y - 40,
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
          className="w-20 h-8 text-sm"
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
