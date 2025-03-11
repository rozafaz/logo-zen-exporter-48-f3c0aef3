
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, Check, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ExportSettings } from './ExportOptions';
import { exportLogoPackage } from '@/lib/exportHelpers';

interface ExportButtonProps {
  logoFile: File | null;
  settings: ExportSettings;
  className?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  logoFile, settings, className, disabled 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const handleExport = async () => {
    if (!logoFile) {
      toast.error('Please upload a logo first');
      return;
    }
    
    setIsExporting(true);
    
    try {
      await exportLogoPackage(logoFile, settings);
      setIsComplete(true);
      toast.success('Export complete! Files ready for download.');
      
      // Reset the complete state after 3 seconds
      setTimeout(() => {
        setIsComplete(false);
      }, 3000);
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting || !logoFile}
      className={cn(
        'relative w-full py-4 rounded-xl font-medium transition-all',
        'flex items-center justify-center gap-2',
        isComplete 
          ? 'bg-green-500 hover:bg-green-600 text-white' 
          : 'bg-primary hover:bg-primary/90 text-primary-foreground',
        (disabled || !logoFile) && 'opacity-50 cursor-not-allowed',
        'animate-fade-in',
        className
      )}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Exporting Logo Package...</span>
        </>
      ) : isComplete ? (
        <>
          <Check className="w-5 h-5" />
          <span>Export Complete!</span>
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          <span>Export Logo Package</span>
        </>
      )}
      
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 rounded-full p-1.5">
        <ArrowDown className="w-4 h-4" />
      </div>
    </button>
  );
};

export default ExportButton;
