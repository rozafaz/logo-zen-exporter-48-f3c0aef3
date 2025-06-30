import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import LogoUploader from '@/components/LogoUploader';
import ExportOptions, { ExportSettings } from '@/components/ExportOptions';
import PreviewSection from '@/components/PreviewSection';
import ExportButton from '@/components/ExportButton';
import LandingPage from '@/components/LandingPage';
import { ExternalLink, Github, Star, Settings, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    formats: ['PNG', 'SVG'],
    colors: ['RGB'],
    resolutions: ['300dpi'],
    brandName: 'Brand',
    backgroundHandling: 'transparent',
    backgroundColor: '#ffffff',
    customColor: '#000000'
  });

  const handleLogoUpload = (file: File, preview: string) => {
    setLogoFile(file);
    setLogoPreview(preview);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary">
      <Header />
      
      <main className="flex-grow px-4 py-8 md:py-12">
        {user ? (
          <div className="max-w-6xl mx-auto">
            <section className="mb-12 text-center animate-slide-down">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                AI Logo Package Exporter
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Automate your logo export workflow with precision and efficiency.
              </p>
              
              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="bg-secondary text-secondary-foreground text-xs rounded-full px-3 py-1 flex items-center">
                  <Star className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  <span>Professional Package</span>
                </div>
                <div className="bg-secondary text-secondary-foreground text-xs rounded-full px-3 py-1 flex items-center">
                  <Settings className="w-3.5 h-3.5 mr-1 text-primary" />
                  <span>Fully Customizable</span>
                </div>
              </div>
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <LogoUploader 
                  onLogoUpload={handleLogoUpload}
                />
                
                <ExportOptions 
                  onChange={setExportSettings}
                />
              </div>
              
              <div className="space-y-6">
                <PreviewSection 
                  logoPreview={logoPreview}
                  settings={exportSettings}
                />
                
                <ExportButton 
                  logoFile={logoFile}
                  settings={exportSettings}
                  disabled={!logoFile}
                />
                
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 animate-fade-in">
                  <h3 className="text-sm font-medium flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-primary" />
                    Pro Tips
                  </h3>
                  <ul className="mt-2 text-sm space-y-2">
                    <li className="flex items-start">
                      <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary mt-0.5 flex-shrink-0" />
                      <span>Use SVG format for best scaling quality</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary mt-0.5 flex-shrink-0" />
                      <span>Include black & white variations for versatility</span>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="w-3.5 h-3.5 mr-2 text-primary mt-0.5 flex-shrink-0" />
                      <span>300dpi is recommended for print materials</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <LandingPage />
        )}
      </main>
      
      <footer className="mt-auto border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © {new Date().getFullYear()} AI Logo Package Exporter. All rights reserved.
          </div>
          
          <div className="flex gap-4">
            <a href="#" className="text-sm text-foreground/70 hover:text-foreground flex items-center">
              <Github className="w-4 h-4 mr-1" />
              GitHub
            </a>
            <a href="#" className="text-sm text-foreground/70 hover:text-foreground flex items-center">
              <ExternalLink className="w-4 h-4 mr-1" />
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
