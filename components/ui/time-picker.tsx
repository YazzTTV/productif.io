'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';

interface TimePickerInputProps {
  value: number;
  onChange: (value: Date) => void;
  disabled?: boolean;
}

export function TimePickerInput({ value, onChange, disabled }: TimePickerInputProps) {
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = event.target.value;
    const [hours] = timeValue.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, 0, 0, 0);
    onChange(date);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:00`;
  };

  return (
    <Input
      type="time"
      value={formatTime(value)}
      onChange={handleTimeChange}
      disabled={disabled}
      step="3600" // Permet uniquement la sélection des heures (pas de minutes)
    />
  );
} 