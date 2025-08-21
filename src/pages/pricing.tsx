/**
 * Pricing Page - Subscription Plans
 * TODO: Implement pricing plans with PlanCard components
 */

import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  // TODO: Replace with actual pricing data from API
  const plans = [
    {
      name: 'Starter',
      price: 99,
      period: 'měsíc',
      features: ['Do 50 uživatelů', 'Základní kurzy', 'Email podpora', 'Základní analytika'],
    },
    {
      name: 'Professional',
      price: 299,
      period: 'měsíc',
      features: ['Do 200 uživatelů', 'Pokročilé kurzy', 'Prioritní podpora', 'Pokročilá analytika', 'Custom branding'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Na míru',
      period: '',
      features: ['Neomezení uživatelé', 'Všechny funkce', '24/7 podpora', 'Vlastní integrace', 'SLA garance'],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="container-xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              Jednoduché, transparentní{' '}
              <span className="text-gradient-primary">ceník</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Vyberte si plán, který nejlépe odpovídá vašim potřebám. 
              Všechny plány zahrnují 14denní zkušební období zdarma.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-primary shadow-soft' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Nejpopulárnější
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    {typeof plan.price === 'number' ? (
                      <>
                        <span className="text-4xl font-bold">{plan.price} Kč</span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold">{plan.price}</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-5 w-5 text-success mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular ? 'gradient-primary text-white' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {typeof plan.price === 'number' ? 'Začít zkušební období' : 'Kontaktovat'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-4">
              Potřebujete jiný plán nebo máte otázky?
            </p>
            <Button variant="outline">
              Kontaktujte náš tým
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;