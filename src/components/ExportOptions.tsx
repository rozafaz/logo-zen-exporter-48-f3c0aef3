
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, Image } from 'lucide-react';
import FormatOption from './export/FormatOption';
import ResolutionOption from './export/ResolutionOption';
import ColorOption from './export/ColorOption';

export interface ExportSettings {
  formats: string[];
  colors: string[];
  resolutions: string[];
  brandName: string;
}

interface ExportOptionsProps {
  onChange: (settings: ExportSettings) => void;
  className?: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ onChange, className }) => {
  const [settings, setSettings] = useState<ExportSettings>({
    formats: ['PNG', 'SVG'],
    colors: ['Original', 'Black', 'White'],
    resolutions: ['72dpi', '300dpi'],
    brandName: 'Brand',
  });

  const updateSettings = (key: keyof ExportSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const toggleOption = (key: keyof ExportSettings, option: string) => {
    const currentOptions = settings[key] as string[];
    if (currentOptions.includes(option)) {
      updateSettings(key, currentOptions.filter(item => item !== option));
    } else {
      updateSettings(key, [...currentOptions, option]);
    }
  };

  const isSelected = (key: keyof ExportSettings, option: string) => {
    return (settings[key] as string[]).includes(option);
  };

  return (
    <div className={cn('rounded-xl glass-panel p-1 animate-fade-in', className)}>
      <Tabs defaultValue="formats" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-2">
          <TabsTrigger value="formats" className="text-sm">Formats</TabsTrigger>
          <TabsTrigger value="colors" className="text-sm">Colors</TabsTrigger>
          <TabsTrigger value="naming" className="text-sm">Naming</TabsTrigger>
        </TabsList>
        
        <TabsContent value="formats" className="p-4 pt-2">
          <h3 className="font-medium mb-3">Export Formats</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <FormatOption 
              icon={<Image className="w-4 h-4" />}
              label="PNG" 
              description="Raster with transparency"
              isSelected={isSelected('formats', 'PNG')}
              onClick={() => toggleOption('formats', 'PNG')} 
            />
            <FormatOption 
              icon={<File className="w-4 h-4" />}
              label="SVG" 
              description="Vector format"
              isSelected={isSelected('formats', 'SVG')}
              onClick={() => toggleOption('formats', 'SVG')}
            />
            <FormatOption 
              icon={<File className="w-4 h-4" />}
              label="EPS" 
              description="Professional print"
              isSelected={isSelected('formats', 'EPS')}
              onClick={() => toggleOption('formats', 'EPS')}
            />
            <FormatOption 
              icon={<File className="w-4 h-4" />}
              label="PDF" 
              description="Vector document"
              isSelected={isSelected('formats', 'PDF')}
              onClick={() => toggleOption('formats', 'PDF')}
            />
            <FormatOption 
              icon={<Image className="w-4 h-4" />}
              label="ICO" 
              description="Favicon format"
              isSelected={isSelected('formats', 'ICO')}
              onClick={() => toggleOption('formats', 'ICO')}
            />
          </div>
          
          <h3 className="font-medium mt-6 mb-3">Resolutions</h3>
          <div className="flex flex-wrap gap-2">
            <ResolutionOption 
              label="72dpi" 
              description="Web/Screen"
              isSelected={isSelected('resolutions', '72dpi')}
              onClick={() => toggleOption('resolutions', '72dpi')}
            />
            <ResolutionOption 
              label="150dpi" 
              description="Medium quality"
              isSelected={isSelected('resolutions', '150dpi')}
              onClick={() => toggleOption('resolutions', '150dpi')}
            />
            <ResolutionOption 
              label="300dpi" 
              description="Print quality"
              isSelected={isSelected('resolutions', '300dpi')}
              onClick={() => toggleOption('resolutions', '300dpi')}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="colors" className="p-4 pt-2">
          <h3 className="font-medium mb-3">Color Variations</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <ColorOption 
              label="Original" 
              colorPreview="#3B82F6"
              isSelected={isSelected('colors', 'Original')}
              onClick={() => toggleOption('colors', 'Original')}
            />
            <ColorOption 
              label="Black" 
              colorPreview="#000000"
              isSelected={isSelected('colors', 'Black')}
              onClick={() => toggleOption('colors', 'Black')}
            />
            <ColorOption 
              label="White" 
              colorPreview="#FFFFFF"
              isSelected={isSelected('colors', 'White')}
              onClick={() => toggleOption('colors', 'White')}
            />
            <ColorOption 
              label="Grayscale" 
              colorPreview="#888888"
              isSelected={isSelected('colors', 'Grayscale')}
              onClick={() => toggleOption('colors', 'Grayscale')}
            />
            <ColorOption 
              label="Inverted" 
              colorPreview="#DDDDDD"
              isSelected={isSelected('colors', 'Inverted')}
              onClick={() => toggleOption('colors', 'Inverted')}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="naming" className="p-4 pt-2">
          <h3 className="font-medium mb-3">Brand Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Brand Name
              </label>
              <input 
                type="text"
                value={settings.brandName}
                onChange={(e) => updateSettings('brandName', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your brand name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Naming Preview
              </label>
              <div className="bg-secondary p-3 rounded-md text-sm font-mono overflow-x-auto">
                {settings.brandName || 'Brand'}_Primary_RGB_300dpi.png
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExportOptions;
