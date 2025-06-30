
import React from 'react';
import { File, Image } from 'lucide-react';
import FormatOption from './FormatOption';

interface OutputFormatProps {
  selectedFormats: string[];
  onFormatToggle: (format: string) => void;
}

const OutputFormat: React.FC<OutputFormatProps> = ({ selectedFormats, onFormatToggle }) => {
  const isFormatSelected = (format: string) => selectedFormats.includes(format);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b border-border pb-2">Output Format</h3>
      <div className="grid grid-cols-2 gap-3">
        <FormatOption 
          icon={<File className="w-4 h-4" />}
          label="SVG" 
          description="Vector format"
          isSelected={isFormatSelected('SVG')}
          onClick={() => onFormatToggle('SVG')}
        />
        <FormatOption 
          icon={<File className="w-4 h-4" />}
          label="EPS" 
          description="Vector format"
          isSelected={isFormatSelected('EPS')}
          onClick={() => onFormatToggle('EPS')}
        />
        <FormatOption 
          icon={<File className="w-4 h-4" />}
          label="PDF" 
          description="Vector format"
          isSelected={isFormatSelected('PDF')}
          onClick={() => onFormatToggle('PDF')}
        />
        <FormatOption 
          icon={<Image className="w-4 h-4" />}
          label="PNG" 
          description="Raster format"
          isSelected={isFormatSelected('PNG')}
          onClick={() => onFormatToggle('PNG')} 
        />
      </div>
    </div>
  );
};

export default OutputFormat;
