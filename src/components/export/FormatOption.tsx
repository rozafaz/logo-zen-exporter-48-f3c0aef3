
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface FormatOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

const FormatOption: React.FC<FormatOptionProps> = ({
  icon, label, description, isSelected, onClick, className
}) => (
  <button
    className={cn(
      "flex items-center p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
      isSelected 
        ? "border-primary bg-primary/5 hover:bg-primary/10 shadow-sm ring-1 ring-primary/20"
        : "border-border hover:border-primary/30 hover:bg-secondary/50",
      className
    )}
    onClick={onClick}
  >
    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary/30 mr-3 flex-shrink-0">
      {icon}
    </div>
    <div className="text-left flex-1 min-w-0">
      <div className="font-medium text-sm truncate">{label}</div>
      {description && (
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      )}
    </div>
    {isSelected && (
      <CheckCircle2 className="w-5 h-5 text-primary ml-2 flex-shrink-0" />
    )}
  </button>
);

export default FormatOption;
