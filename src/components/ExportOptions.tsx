import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { File, Image, Palette, Sun, Moon, RotateCcw, Square, CircleDot, Pipette } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import FormatOption from './export/FormatOption';
import ColorPicker from './export/ColorPicker';

export interface ExportSettings {
  formats: string[];
  colors: string[];
  resolutions: string[];
  brandName: string;
  backgroundHandling: 'transparent' | 'remove' | 'replace';
  backgroundColor?: string;
  customColor?: string;
}

interface ExportOptionsProps {
  onChange: (settings: ExportSettings) => void;
  className?: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ onChange, className }) => {
  const [settings, setSettings] = useState<ExportSettings>({
    formats: ['PNG', 'SVG'],
    colors: [],
    resolutions: ['300dpi'],
    brandName: 'Brand',
    backgroundHandling: 'transparent',
    backgroundColor: '#ffffff',
    customColor: '#000000'
  });

  const updateSettings = (key: keyof ExportSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const toggleFormat = (format: string) => {
    const currentFormats = settings.formats;
    if (currentFormats.includes(format)) {
      updateSettings('formats', currentFormats.filter(item => item !== format));
    } else {
      updateSettings('formats', [...currentFormats, format]);
    }
  };

  const toggleColor = (color: string) => {
    const currentColors = settings.colors;
    if (currentColors.includes(color)) {
      updateSettings('colors', currentColors.filter(item => item !== color));
    } else {
      updateSettings('colors', [...currentColors, color]);
    }
  };

  const isFormatSelected = (format: string) => {
    return settings.formats.includes(format);
  };

  const isColorSelected = (color: string) => {
    return settings.colors.includes(color);
  };

  const isPngSelected = () => settings.formats.includes('PNG');
  const isVectorSelected = () => settings.formats.some(f => ['SVG', 'EPS', 'PDF'].includes(f));

  return (
    <div className={cn('rounded-xl glass-panel p-6 space-y-8 animate-fade-in', className)}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Export Settings</h2>
        <p className="text-muted-foreground mt-1">Configure your logo export options</p>
      </div>

      {/* Section 1: Upload Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold border-b border-border pb-2">Upload</h3>
        <div className="bg-secondary/30 rounded-lg p-4">
          <h4 className="font-medium mb-2">Supported Inputs</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• File types (vector only): .ai, .svg, .eps, .pdf</li>
            <li>• Any artboard or object dimensions</li>
            <li>• Any background (solid, gradient, texture, embedded imagery)</li>
          </ul>
        </div>
      </div>

      {/* Section 2: Output Format */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b border-border pb-2">Output Format</h3>
        <div className="grid grid-cols-2 gap-3">
          <FormatOption 
            icon={<File className="w-4 h-4" />}
            label="SVG" 
            description="Vector format"
            isSelected={isFormatSelected('SVG')}
            onClick={() => toggleFormat('SVG')}
          />
          <FormatOption 
            icon={<File className="w-4 h-4" />}
            label="EPS" 
            description="Vector format"
            isSelected={isFormatSelected('EPS')}
            onClick={() => toggleFormat('EPS')}
          />
          <FormatOption 
            icon={<File className="w-4 h-4" />}
            label="PDF" 
            description="Vector format"
            isSelected={isFormatSelected('PDF')}
            onClick={() => toggleFormat('PDF')}
          />
          <FormatOption 
            icon={<Image className="w-4 h-4" />}
            label="PNG" 
            description="Raster format"
            isSelected={isFormatSelected('PNG')}
            onClick={() => toggleFormat('PNG')} 
          />
        </div>
      </div>

      {/* Section 3: Resolution (Only when PNG selected) */}
      {isPngSelected() && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Resolution</h3>
          <RadioGroup 
            value={settings.resolutions[0]} 
            onValueChange={(value) => updateSettings('resolutions', [value])}
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
      )}

      {/* Section 4: Color Model (Only for PNG, SVG, EPS) */}
      {(isPngSelected() || isVectorSelected()) && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Color Model</h3>
          
          {/* Preset Color Options */}
          <div className="grid grid-cols-2 gap-3">
            <FormatOption 
              icon={<Square className="w-4 h-4 fill-black" />}
              label="Black" 
              description="Pure black version"
              isSelected={isColorSelected('Black')}
              onClick={() => toggleColor('Black')}
            />
            <FormatOption 
              icon={<Square className="w-4 h-4 fill-white stroke-gray-400" />}
              label="White" 
              description="Pure white version"
              isSelected={isColorSelected('White')}
              onClick={() => toggleColor('White')}
            />
            <FormatOption 
              icon={<CircleDot className="w-4 h-4" />}
              label="Grayscale" 
              description="Monochrome applications"
              isSelected={isColorSelected('Grayscale')}
              onClick={() => toggleColor('Grayscale')}
            />
            <FormatOption 
              icon={<RotateCcw className="w-4 h-4" />}
              label="Inverted" 
              description="Reverse tonal palette"
              isSelected={isColorSelected('Inverted')}
              onClick={() => toggleColor('Inverted')}
            />
          </div>
          
          {/* Custom Color Section */}
          <div className="mt-6">
            <h4 className="text-base font-medium mb-4">Custom Color</h4>
            
            <div className="bg-secondary/20 border border-border/50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleColor('Custom')}
                      className={cn(
                        "relative w-12 h-12 rounded-lg border-2 cursor-pointer transition-all duration-200 group",
                        isColorSelected('Custom') 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      )}
                      style={{ backgroundColor: settings.customColor || '#000000' }}
                      title="Click to select custom color"
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pipette className="w-4 h-4 text-white drop-shadow-lg" />
                      </div>
                    </button>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Click color to select</Label>
                      <input
                        type="text"
                        value={settings.customColor || '#000000'}
                        onChange={(e) => updateSettings('customColor', e.target.value)}
                        className="w-24 px-2 py-1 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
                
                {isColorSelected('Custom') && (
                  <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Selected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Background Handling (For raster and vector with transparency) */}
      {(isPngSelected() || isVectorSelected()) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Background</h3>
          <RadioGroup 
            value={settings.backgroundHandling} 
            onValueChange={(value: 'transparent' | 'remove' | 'replace') => updateSettings('backgroundHandling', value)}
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
          
          {/* Color picker for background replacement */}
          {settings.backgroundHandling === 'replace' && (
            <div className="ml-6 mt-3">
              <ColorPicker 
                value={settings.backgroundColor || '#ffffff'}
                onChange={(color) => updateSettings('backgroundColor', color)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportOptions;
