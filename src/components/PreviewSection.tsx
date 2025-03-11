
import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { FileImage, FileVector, FolderTree, BrandFolder } from 'lucide-react';
import type { ExportSettings } from './ExportOptions';

interface PreviewSectionProps {
  logoPreview: string | null;
  settings: ExportSettings;
  className?: string;
}

const PreviewSection: React.FC<PreviewSectionProps> = ({ 
  logoPreview, settings, className 
}) => {
  // Generate a list of files based on the current settings
  const generateFileList = () => {
    const files: { icon: React.ReactNode; name: string }[] = [];
    const { formats, colors, resolutions, brandName } = settings;
    
    colors.forEach(color => {
      formats.forEach(format => {
        if (['PNG', 'JPG'].includes(format)) {
          resolutions.forEach(resolution => {
            const icon = <FileImage className="w-4 h-4" />;
            const name = `${brandName}_${color}_${format}_${resolution}.${format.toLowerCase()}`;
            files.push({ icon, name });
          });
        } else {
          const icon = <FileVector className="w-4 h-4" />;
          const name = `${brandName}_${color}_${format}.${format.toLowerCase()}`;
          files.push({ icon, name });
        }
      });
    });
    
    return files;
  };
  
  const fileList = generateFileList();
  
  return (
    <div className={cn(
      'rounded-xl glass-panel overflow-hidden animate-fade-in',
      className
    )}>
      <div className="p-4 border-b">
        <h3 className="font-medium">Export Preview</h3>
        <p className="text-sm text-muted-foreground">
          {fileList.length} files will be generated
        </p>
      </div>
      
      <div className="p-4 flex flex-col md:flex-row gap-4">
        {logoPreview && (
          <div className="flex-shrink-0 w-full md:w-1/3">
            <div className="text-sm font-medium mb-2">Logo Preview</div>
            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
              <img 
                src={logoPreview} 
                alt="Logo preview" 
                className="max-w-full max-h-[120px] object-contain"
              />
            </div>
          </div>
        )}
        
        <div className="flex-grow">
          <div className="text-sm font-medium mb-2">Folder Structure</div>
          <div className="bg-gray-100 rounded-lg p-4 h-[120px] overflow-y-auto text-sm">
            <div className="flex items-center">
              <BrandFolder className="w-4 h-4 mr-2 text-primary" />
              <span className="font-medium">{settings.brandName} Logo Package</span>
            </div>
            
            <div className="ml-5 mt-2">
              <div className="flex items-center">
                <FolderTree className="w-4 h-4 mr-2 text-primary/70" />
                <span>Primary Logo</span>
              </div>
              
              <div className="flex items-center mt-1">
                <FolderTree className="w-4 h-4 mr-2 text-primary/70" />
                <span>Black & White Versions</span>
              </div>
              
              <div className="flex items-center mt-1">
                <FolderTree className="w-4 h-4 mr-2 text-primary/70" />
                <span>Social Media Logos</span>
              </div>
              
              {settings.formats.includes('ICO') && (
                <div className="flex items-center mt-1">
                  <FolderTree className="w-4 h-4 mr-2 text-primary/70" />
                  <span>Favicon</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="p-4 max-h-[200px] overflow-y-auto">
        <div className="text-sm font-medium mb-2">Files to be Generated</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {fileList.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center text-xs py-1.5 px-2 rounded-md hover:bg-secondary/50"
            >
              <span className="text-primary mr-2">{file.icon}</span>
              <span className="truncate">{file.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreviewSection;
