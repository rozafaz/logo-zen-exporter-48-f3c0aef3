
import React from 'react';

const UploadInfo: React.FC = () => {
  return (
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
  );
};

export default UploadInfo;
