
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2,
  Shield,
  Star, 
  Briefcase,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const PricingPlans = () => {
  const navigate = useNavigate();
  
  return (
    <section id="pricing" className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect package for your logo export needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <Card className="border-2 border-border flex flex-col h-full">
            <CardHeader className="pb-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <div className="mt-4 flex items-baseline justify-center">
                <span className="text-4xl font-extrabold">€9</span>
                <span className="ml-1 text-muted-foreground"> /month</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                or €7.50/month billed annually
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Up to 20 logo packages per month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Community support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>48-hour SLA for email ticket queue</span>
                </li>
              </ul>
              <div className="mt-6 text-sm text-muted-foreground">
                Ideal for individual designers or very small brands who only need occasional exports.
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Start with Starter
              </Button>
            </CardFooter>
          </Card>

          {/* Professional Plan */}
          <Card className="border-2 border-primary relative flex flex-col h-full">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="bg-primary text-primary-foreground text-xs font-medium py-1 px-3 rounded-full">
                Popular
              </span>
            </div>
            <CardHeader className="pb-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Professional</CardTitle>
              <div className="mt-4 flex items-baseline justify-center">
                <span className="text-4xl font-extrabold">€29</span>
                <span className="ml-1 text-muted-foreground"> /month</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                or €24/month billed annually
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Up to 100 logo packages per month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Priority email support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>24-hour SLA response time</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>API access for integration</span>
                </li>
              </ul>
              <div className="mt-6 text-sm text-muted-foreground">
                Suited to freelancers, agencies, or growing teams with steady export needs and wanting to automate via API.
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Choose Professional
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-2 border-border flex flex-col h-full">
            <CardHeader className="pb-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <div className="mt-4 flex items-baseline justify-center">
                <span className="text-4xl font-extrabold">€79</span>
                <span className="ml-1 text-muted-foreground"> /month</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                or €65/month billed annually
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Unlimited logo packages</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>4-hour SLA response time</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>SSO (SAML/OAuth)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Advanced audit logs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Volume-discount quotes</span>
                </li>
              </ul>
              <div className="mt-6 text-sm text-muted-foreground">
                Built for larger organizations or design studios with high-volume workflows, custom security requirements, and guaranteed uptime.
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Contact Sales
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
