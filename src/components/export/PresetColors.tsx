
import React from 'react';
import { Square, CircleDot, RotateCcw } from 'lucide-react';
import FormatOption from './FormatOption';

interface PresetColorsProps {
  selectedColors: string[];
  onColorToggle: (color: string) => void;
}

const PresetColors: React.FC<PresetColorsProps> = ({ selectedColors, onColorToggle }) => {
  const isColorSelected = (color: string) => selectedColors.includes(color);

  return (
    <div className="grid grid-cols-2 gap-3">
      <FormatOption 
        icon={<Square className="w-4 h-4 fill-black" />}
        label="Black" 
        description="Pure black version"
        isSelected={isColorSelected('Black')}
        onClick={() => onColorToggle('Black')}
      />
      <FormatOption 
        icon={<Square className="w-4 h-4 fill-white stroke-gray-400" />}
        label="White" 
        description="Pure white version"
        isSelected={isColorSelected('White')}
        onClick={() => onColorToggle('White')}
      />
      <FormatOption 
        icon={<CircleDot className="w-4 h-4" />}
        label="Grayscale" 
        description="Monochrome applications"
        isSelected={isColorSelected('Grayscale')}
        onClick={() => onColorToggle('Grayscale')}
      />
      <FormatOption 
        icon={<RotateCcw className="w-4 h-4" />}
        label="Inverted" 
        description="Reverse tonal palette"
        isSelected={isColorSelected('Inverted')}
        onClick={() => onColorToggle('Inverted')}
      />
    </div>
  );
};

export default PresetColors;
