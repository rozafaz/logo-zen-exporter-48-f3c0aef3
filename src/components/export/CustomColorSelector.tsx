
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Palette, Pipette } from 'lucide-react';
import { Label } from '@/components/ui/label';
import ColorPicker from './ColorPicker';

interface CustomColorSelectorProps {
  isSelected: boolean;
  customColor: string;
  onToggle: () => void;
  onColorChange: (color: string) => void;
}

const CustomColorSelector: React.FC<CustomColorSelectorProps> = ({
  isSelected,
  customColor,
  onToggle,
  onColorChange
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleToggle = () => {
    onToggle();
    if (isSelected) {
      setShowColorPicker(false);
    } else {
      setShowColorPicker(true);
    }
  };

  return (
    <div className="mt-8">
      <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        Custom Color
      </h4>
      
      <div className="bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button
                onClick={handleToggle}
                className={cn(
                  "relative w-12 h-12 rounded-xl border-2 cursor-pointer transition-all duration-300 group shadow-md hover:shadow-lg",
                  isSelected 
                    ? "border-primary ring-4 ring-primary/20 scale-105" 
                    : "border-border/50 hover:border-primary/60 hover:scale-105"
                )}
                style={{ backgroundColor: customColor }}
                title={isSelected ? "Click to unselect custom color" : "Click to select custom color"}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/10 rounded-xl backdrop-blur-sm">
                  <Pipette className="w-4 h-4 text-white drop-shadow-lg" />
                </div>
              </button>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/90">
                {isSelected ? 'Selected Color' : 'Custom Color'}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-28 px-3 py-2 text-sm font-mono rounded-lg border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all backdrop-blur-sm"
                  placeholder="#000000"
                />
                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  HEX
                </div>
              </div>
            </div>
          </div>
          
          {isSelected && (
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-full text-sm font-medium shadow-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              Selected
            </div>
          )}
        </div>
        
        {showColorPicker && isSelected && (
          <div className="mt-6 p-4 bg-background/60 rounded-xl border border-border/30 backdrop-blur-sm animate-fade-in">
            <ColorPicker 
              value={customColor}
              onChange={onColorChange}
            />
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
          <Pipette className="w-3 h-3" />
          {isSelected 
            ? 'Click the color swatch to unselect or open the picker'
            : 'Click the color swatch to select this custom color'
          }
        </div>
      </div>
    </div>
  );
};

export default CustomColorSelector;
