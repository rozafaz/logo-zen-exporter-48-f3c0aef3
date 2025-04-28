
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface FormatOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

const FormatOption: React.FC<FormatOptionProps> = ({ 
  icon, label, description, isSelected, onClick 
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
    <div className="mr-3 text-primary">
      {icon}
    </div>
    <div className="text-left">
      <div className="font-medium text-sm flex items-center">
        {label}
        {isSelected && <Check className="w-3.5 h-3.5 ml-1.5 text-primary" />}
      </div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  </button>
);

export default FormatOption;
