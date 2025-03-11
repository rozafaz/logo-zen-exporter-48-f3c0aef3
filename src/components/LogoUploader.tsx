
import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LogoUploaderProps {
  onLogoUpload: (file: File, preview: string) => void;
  className?: string;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ onLogoUpload, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    // Check if file is less than 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Please upload a file smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const previewUrl = e.target.result as string;
        setPreview(previewUrl);
        onLogoUpload(file, previewUrl);
        toast.success('Logo uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={cn(
        'w-full p-8 rounded-xl border-2 border-dashed transition-all duration-200 animate-fade-in',
        isDragging ? 'border-primary bg-primary/5' : 'border-border',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        {preview ? (
          <div className="relative w-full max-w-[250px] h-[150px] bg-white rounded-lg shadow-sm overflow-hidden animate-scale-in">
            <img 
              src={preview} 
              alt="Logo preview" 
              className="w-full h-full object-contain p-4"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-float">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-primary"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
        
        <div className="text-center">
          <h3 className="text-lg font-semibold">{preview ? 'Logo Uploaded' : 'Upload Your Logo'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview 
              ? 'Your logo is ready for export.' 
              : 'Drag and drop your logo file here, or click to browse.'}
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="flex gap-2">
          <button
            onClick={handleButtonClick}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
          >
            {preview ? 'Replace Logo' : 'Select File'}
          </button>
          
          {preview && (
            <button
              onClick={() => {
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          Supported formats: SVG, PNG, JPG (Max: 5MB)
        </div>
      </div>
    </div>
  );
};

export default LogoUploader;
