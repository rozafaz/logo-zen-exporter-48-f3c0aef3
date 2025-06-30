
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import UploadInfo from './export/UploadInfo';
import OutputFormat from './export/OutputFormat';
import ResolutionSelector from './export/ResolutionSelector';
import ColorModelSelector from './export/ColorModelSelector';
import BackgroundSelector from './export/BackgroundSelector';

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

  const isPngSelected = () => settings.formats.includes('PNG');
  const isVectorSelected = () => settings.formats.some(f => ['SVG', 'EPS', 'PDF'].includes(f));

  return (
    <div className={cn('rounded-xl glass-panel p-6 space-y-8 animate-fade-in', className)}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Export Settings</h2>
        <p className="text-muted-foreground mt-1">Configure your logo export options</p>
      </div>

      {/* Section 1: Upload Info */}
      <UploadInfo />

      {/* Section 2: Output Format */}
      <OutputFormat 
        selectedFormats={settings.formats}
        onFormatToggle={toggleFormat}
      />

      {/* Section 3: Resolution (Only when PNG selected) */}
      {isPngSelected() && (
        <ResolutionSelector
          selectedResolution={settings.resolutions[0]}
          onResolutionChange={(value) => updateSettings('resolutions', [value])}
        />
      )}

      {/* Section 4: Color Model (Only for PNG, SVG, EPS) */}
      {(isPngSelected() || isVectorSelected()) && (
        <ColorModelSelector
          selectedColors={settings.colors}
          customColor={settings.customColor || '#000000'}
          onColorToggle={toggleColor}
          onCustomColorChange={(color) => updateSettings('customColor', color)}
        />
      )}

      {/* Section 5: Background Handling (For raster and vector with transparency) */}
      {(isPngSelected() || isVectorSelected()) && (
        <BackgroundSelector
          backgroundHandling={settings.backgroundHandling}
          backgroundColor={settings.backgroundColor || '#ffffff'}
          onBackgroundHandlingChange={(value) => updateSettings('backgroundHandling', value)}
          onBackgroundColorChange={(color) => updateSettings('backgroundColor', color)}
        />
      )}
    </div>
  );
};

export default ExportOptions;
