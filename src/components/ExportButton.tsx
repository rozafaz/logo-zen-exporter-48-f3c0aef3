
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, Check, Download, Loader2, Bug, Activity } from 'lucide-react';
import { toast } from 'sonner';
import type { ExportSettings } from './ExportOptions';
import { exportLogoPackage, checkServerAndInkscape } from '@/lib/exportHelpers';

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
  const [isChecking, setIsChecking] = useState(false);
  
  const handleDiagnose = async () => {
    setIsChecking(true);
    toast.info('Checking server and Inkscape availability...');
    
    try {
      const { serverRunning, inkscapeAvailable, message, version } = await checkServerAndInkscape();
      
      if (serverRunning && inkscapeAvailable) {
        toast.success(`Server and Inkscape are available! Version: ${version}`);
      } else if (serverRunning && !inkscapeAvailable) {
        toast.error(`Server is running but Inkscape is not available: ${message}`);
      } else {
        toast.error(`Server connection failed: ${message}`);
      }
    } catch (error) {
      console.error('Diagnostic check error:', error);
      toast.error(`Diagnostic error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleExport = async () => {
    if (!logoFile) {
      toast.error('Please upload a logo first');
      return;
    }
    
    // Validate export settings
    if (settings.formats.length === 0) {
      toast.error('Please select at least one export format');
      return;
    }
    
    if (settings.colors.length === 0) {
      toast.error('Please select at least one color variation');
      return;
    }
    
    if ((settings.formats.includes('PNG') || settings.formats.includes('JPG')) && 
        settings.resolutions.length === 0) {
      toast.error('Please select at least one resolution for raster formats');
      return;
    }
    
    setIsExporting(true);
    toast.info('Sending logo to server for processing...');
    
    try {
      console.log('Starting export process with settings:', settings);
      console.log('Logo file type:', logoFile.type, 'name:', logoFile.name, 'size:', logoFile.size);
      
      // Perform export - now calls the backend API
      await exportLogoPackage(logoFile, settings);
      
      setIsComplete(true);
      toast.success('Export complete! Files downloaded.');
      
      // Reset the complete state after 3 seconds
      setTimeout(() => {
        setIsComplete(false);
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="space-y-2">
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
            <span>Processing on Server...</span>
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
      
      {/* Diagnostic button */}
      <button
        onClick={handleDiagnose}
        disabled={isChecking}
        className={cn(
          'w-full py-2 rounded-lg font-medium transition-all text-sm',
          'flex items-center justify-center gap-2',
          'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
          isChecking && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isChecking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Checking Server & Inkscape...</span>
          </>
        ) : (
          <>
            <Activity className="w-4 h-4" />
            <span>Run Server Diagnostics</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ExportButton;
