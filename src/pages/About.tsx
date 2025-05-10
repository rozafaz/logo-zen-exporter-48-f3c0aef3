
import React from 'react';
import Header from '@/components/Header';
import AppIntroduction from '@/components/AppIntroduction';
import { Github, ExternalLink } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="flex-grow">
        <AppIntroduction />
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

export default About;
