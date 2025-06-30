
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import ColorPicker from './ColorPicker';

interface BackgroundSelectorProps {
  backgroundHandling: 'transparent' | 'remove' | 'replace';
  backgroundColor: string;
  onBackgroundHandlingChange: (value: 'transparent' | 'remove' | 'replace') => void;
  onBackgroundColorChange: (color: string) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  backgroundHandling,
  backgroundColor,
  onBackgroundHandlingChange,
  onBackgroundColorChange
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Background</h3>
      <RadioGroup 
        value={backgroundHandling} 
        onValueChange={onBackgroundHandlingChange}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="transparent" id="transparent" />
          <Label htmlFor="transparent" className="flex-1">
            <div className="font-medium">Keep Transparency</div>
            <div className="text-sm text-muted-foreground">Preserve as-is</div>
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="remove" id="remove" />
          <Label htmlFor="remove" className="flex-1">
            <div className="font-medium">Remove Background</div>
            <div className="text-sm text-muted-foreground">Auto-detect & strip</div>
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="replace" id="replace" />
          <Label htmlFor="replace" className="flex-1">
            <div className="font-medium">Replace Background</div>
            <div className="text-sm text-muted-foreground">Apply color/gradient</div>
          </Label>
        </div>
      </RadioGroup>
      
      {backgroundHandling === 'replace' && (
        <div className="ml-6 mt-3">
          <ColorPicker 
            value={backgroundColor}
            onChange={onBackgroundColorChange}
          />
        </div>
      )}
    </div>
  );
};

export default BackgroundSelector;
