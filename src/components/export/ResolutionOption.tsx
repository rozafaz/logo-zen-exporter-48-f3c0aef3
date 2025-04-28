
import React from 'react';
import { cn } from '@/lib/utils';
import { Circle, CheckCircle } from 'lucide-react';

interface ResolutionOptionProps {
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const ResolutionOption: React.FC<ResolutionOptionProps> = ({
  label, description, isSelected, onClick
}) => (
  <button
    className={cn(
      "flex items-center px-3 py-2 rounded-lg border transition-all",
      isSelected 
        ? "border-primary bg-primary/5 hover:bg-primary/10"
        : "border-border hover:border-primary/30 hover:bg-secondary"
    )}
    onClick={onClick}
  >
    <div className="text-left flex items-center">
      <div className="mr-2">
        {isSelected 
          ? <CheckCircle className="w-4 h-4 text-primary" /> 
          : <Circle className="w-4 h-4 text-muted-foreground" />
        }
      </div>
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  </button>
);

export default ResolutionOption;
