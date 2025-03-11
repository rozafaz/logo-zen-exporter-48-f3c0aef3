import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, CheckCircle2, Circle, Image, File, Check
} from 'lucide-react';

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
              icon={<Image className="w-4 h-4" />}
              label="JPG" 
              description="Raster format"
              isSelected={isSelected('formats', 'JPG')}
              onClick={() => toggleOption('formats', 'JPG')}
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

interface ColorOptionProps {
  label: string;
  colorPreview: string;
  isSelected: boolean;
  onClick: () => void;
}

const ColorOption: React.FC<ColorOptionProps> = ({
  label, colorPreview, isSelected, onClick
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
    <div 
      className="w-8 h-8 rounded-full mr-3"
      style={{ 
        backgroundColor: colorPreview,
        boxShadow: colorPreview === '#FFFFFF' 
          ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' 
          : 'none'
      }}
    >
      {isSelected && (
        <div className="w-full h-full flex items-center justify-center">
          <CheckCircle2 
            className={cn(
              "w-4 h-4", 
              colorPreview === '#FFFFFF' || colorPreview === '#DDDDDD' 
                ? "text-black" 
                : "text-white"
            )} 
          />
        </div>
      )}
    </div>
    <div className="text-left">
      <div className="font-medium text-sm">{label}</div>
    </div>
  </button>
);

export default ExportOptions;
