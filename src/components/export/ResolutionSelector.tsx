
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ResolutionSelectorProps {
  selectedResolution: string;
  onResolutionChange: (resolution: string) => void;
}

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ 
  selectedResolution, 
  onResolutionChange 
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Resolution</h3>
      <RadioGroup 
        value={selectedResolution} 
        onValueChange={onResolutionChange}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="72dpi" id="72dpi" />
          <Label htmlFor="72dpi" className="flex-1">
            <div className="font-medium">Low (72 dpi)</div>
            <div className="text-sm text-muted-foreground">Web & on-screen</div>
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="150dpi" id="150dpi" />
          <Label htmlFor="150dpi" className="flex-1">
            <div className="font-medium">Medium (150 dpi)</div>
            <div className="text-sm text-muted-foreground">Social & docs</div>
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="300dpi" id="300dpi" />
          <Label htmlFor="300dpi" className="flex-1">
            <div className="font-medium">High (300 dpi)</div>
            <div className="text-sm text-muted-foreground">Print & signage</div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ResolutionSelector;
