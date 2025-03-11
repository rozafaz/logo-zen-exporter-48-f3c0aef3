
import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn(
      'w-full py-6 px-8 flex items-center justify-between',
      'animate-fade-in border-b border-gray-100',
      className
    )}>
      <div className="flex items-center">
        <div className="relative mr-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg animate-float">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5 text-white"
            >
              <path d="M2 8V4a2 2 0 0 1 2-2h4" />
              <path d="M22 8V4a2 2 0 0 0-2-2h-4" />
              <path d="M8 22h8" />
              <path d="M12 17v5" />
              <path d="M5 17H2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-medium tracking-tight">AI Logo Exporter</h1>
          <p className="text-sm text-muted-foreground">Export your logo in multiple formats</p>
        </div>
      </div>
      <nav className="hidden md:flex gap-6">
        <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Features</a>
        <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Documentation</a>
        <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Help</a>
      </nav>
      <div className="flex items-center gap-2">
        <button className="text-sm px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Sign In</button>
        <button className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Register</button>
      </div>
    </header>
  );
};

export default Header;
