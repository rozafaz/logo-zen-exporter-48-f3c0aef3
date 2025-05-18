
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface ColorOptionProps {
  label: string;
  colorPreview: string;
  isSelected: boolean;
  onClick: () => void;
}

const ColorOption: React.FC<ColorOptionProps> = ({
  label, colorPreview, isSelected, onClick
}) => (
  <button
    className={cn(
      "flex items-center p-3 rounded-lg border transition-all",
      isSelected 
        ? "border-primary bg-primary/5 hover:bg-primary/10"
        : "border-border hover:border-primary/30 hover:bg-secondary"
    )}
    onClick={onClick}
  >
    <div 
      className="w-8 h-8 rounded-full mr-3"
      style={{ 
        backgroundColor: colorPreview,
        boxShadow: colorPreview === '#FFFFFF' 
          ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' 
          : 'none'
      }}
    >
      {isSelected && (
        <div className="w-full h-full flex items-center justify-center">
          <CheckCircle2 
            className={cn(
              "w-4 h-4", 
              colorPreview === '#FFFFFF' || colorPreview === '#DDDDDD' 
                ? "text-black" 
                : "text-white"
            )} 
          />
        </div>
      )}
    </div>
    <div className="text-left">
      <div className="font-medium text-sm">{label}</div>
    </div>
  </button>
);

export default ColorOption;
