
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface ColorOptionProps {
  label: string;
  colorPreview: string;
  isSelected: boolean;
  onClick: () => void;
  isCustom?: boolean;
}

const ColorOption: React.FC<ColorOptionProps> = ({
  label, colorPreview, isSelected, onClick, isCustom = false
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
      className={cn(
        "w-8 h-8 rounded-full mr-3",
        isCustom && !colorPreview && "bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
      )}
      style={{ 
        backgroundColor: colorPreview || undefined,
        boxShadow: (colorPreview === '#FFFFFF' || colorPreview === '') 
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
      {isCustom && <div className="text-xs text-muted-foreground">{colorPreview || "Select color"}</div>}
    </div>
  </button>
);

export default ColorOption;
