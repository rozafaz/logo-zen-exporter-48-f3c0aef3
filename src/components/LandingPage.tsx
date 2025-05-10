
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Package, 
  CheckCircle2, 
  Palette, 
  FileDigit, 
  FileImage 
} from 'lucide-react';
import PricingPlans from './PricingPlans';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="py-12 md:py-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              AI Logo Package Exporter
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Export your logo in multiple formats with precision and efficiency. Sign in to access our professional export tools.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <Button onClick={() => navigate('/auth')} className="gap-2">
              Sign In to Access
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/auth?tab=signUp')} variant="outline" className="gap-2">
              Create an Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Secure Storage</h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Your logos and brand assets are securely stored and accessible only to you.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm">
            <div className="p-2 bg-primary/10 rounded-full">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Fast Processing</h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Our AI-powered tools process your logos quickly and efficiently.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 shadow-sm">
            <div className="p-2 bg-primary/10 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Multiple Formats</h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Export to PNG, SVG, and more with customizable colors and resolutions.
            </p>
          </div>
        </div>

        {/* Content from AppIntroduction */}
        <section className="my-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What You Can Do</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform streamlines the logo export process for designers, marketers, and brand managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-6">Export in Multiple Formats</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Vector Formats (SVG)</span>
                    <p className="text-sm text-muted-foreground">Perfect for scalable applications and print materials</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Print-Ready PDFs</span>
                    <p className="text-sm text-muted-foreground">High-quality outputs ready for professional printing</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Web & Social Media (PNG)</span>
                    <p className="text-sm text-muted-foreground">Perfect for online use with transparency</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Favicon (ICO)</span>
                    <p className="text-sm text-muted-foreground">Website favicon files for browser tabs</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-muted rounded-xl overflow-hidden flex items-center justify-center">
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="aspect-square rounded-lg bg-background flex items-center justify-center">
                  <FileImage className="h-10 w-10 text-primary/70" />
                  <span className="ml-2 font-medium">.PNG</span>
                </div>
                <div className="aspect-square rounded-lg bg-background flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary/70">
                    <path fill="currentColor" d="M5 21v-18h14v18h-14zm2-2h10v-14h-10v14z" />
                    <path fill="currentColor" d="M10 8h4v8h-4z" />
                  </svg>
                  <span className="ml-2 font-medium">.SVG</span>
                </div>
                <div className="aspect-square rounded-lg bg-background flex items-center justify-center">
                  <FileDigit className="h-10 w-10 text-primary/70" />
                  <span className="ml-2 font-medium">.PDF</span>
                </div>
                <div className="aspect-square rounded-lg bg-background flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-10 w-10 text-primary/70">
                    <path fill="currentColor" d="M3 3h18v18h-18v-18z" />
                  </svg>
                  <span className="ml-2 font-medium">.ICO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-muted rounded-xl overflow-hidden flex items-center justify-center">
              <div className="p-8 flex flex-col items-center">
                <div className="w-48 h-32 bg-background rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-24 h-24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="#4CAF50" />
                    <path d="M8 12l3 3 6-6" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <div className="w-48 h-8 bg-background rounded-lg mb-2"></div>
                <div className="w-36 h-8 bg-primary/20 rounded-lg"></div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-6">Customization Options</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Multiple Resolutions</span>
                    <p className="text-sm text-muted-foreground">Standard 72dpi for web and high-res 300dpi for print</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Color Transformations</span>
                    <p className="text-sm text-muted-foreground">Convert to black or white for different backgrounds</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Custom Naming</span>
                    <p className="text-sm text-muted-foreground">Set your brand name for consistent file naming</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl mt-16 rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Get Started Today</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Create an account to access our full suite of logo exporting tools. Already have an account? Sign in to continue your work.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/auth?tab=signUp')} size="sm">
                  Sign Up
                </Button>
                <Button onClick={() => navigate('/auth')} variant="outline" size="sm">
                  Sign In
                </Button>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
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
                  <path d="M2 8V4a2 2 0 0 1 2-2h4" />
                  <path d="M22 8V4a2 2 0 0 0-2-2h-4" />
                  <path d="M8 22h8" />
                  <path d="M12 17v5" />
                  <path d="M5 17H2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Add the Pricing Plans Section */}
        <PricingPlans />
      </div>
    </div>
  );
};

export default LandingPage;
