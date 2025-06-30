
import React from 'react';
import PresetColors from './PresetColors';
import CustomColorSelector from './CustomColorSelector';

interface ColorModelSelectorProps {
  selectedColors: string[];
  customColor: string;
  onColorToggle: (color: string) => void;
  onCustomColorChange: (color: string) => void;
}

const ColorModelSelector: React.FC<ColorModelSelectorProps> = ({
  selectedColors,
  customColor,
  onColorToggle,
  onCustomColorChange
}) => {
  const isCustomColorSelected = selectedColors.includes('Custom');

  const handleCustomColorToggle = () => {
    if (isCustomColorSelected) {
      onColorToggle('Custom'); // This will remove it
    } else {
      onColorToggle('Custom'); // This will add it
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Color Model</h3>
      
      {/* Preset Color Options */}
      <PresetColors 
        selectedColors={selectedColors}
        onColorToggle={onColorToggle}
      />
      
      {/* Custom Color Section */}
      <CustomColorSelector
        isSelected={isCustomColorSelected}
        customColor={customColor}
        onToggle={handleCustomColorToggle}
        onColorChange={onCustomColorChange}
      />
    </div>
  );
};

export default ColorModelSelector;
