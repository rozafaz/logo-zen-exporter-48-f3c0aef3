
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const presetColors = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd',
    '#6c757d', '#495057', '#343a40', '#212529', '#000000',
    '#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997',
    '#17a2b8', '#007bff', '#6f42c1', '#e83e8c'
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <div 
          className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded border border-border cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="#ffffff"
        />
      </div>
      
      {isOpen && (
        <div className="grid grid-cols-11 gap-1 p-3 bg-secondary/30 rounded-lg">
          {presetColors.map((color) => (
            <button
              key={color}
              className={cn(
                "w-6 h-6 rounded border hover:scale-110 transition-transform",
                color === '#ffffff' && "border-gray-300",
                color === value && "ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
