/**
 * Hero Section Component
 * Main landing page hero with CTA and visual elements
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Nová éra vzdělávání s AI
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Vzdělávání budoucnosti s{' '}
              <span className="text-gradient-primary">umělou inteligencí</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Lector AI transformuje způsob, jakým se učíme a vyučujeme. 
              Personalizované kurzy, inteligentní hodnocení a pokročilá analytika 
              pro moderní vzdělávací instituce.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gradient-primary text-white text-lg px-8 py-4">
                Spustit aplikaci
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                <PlayCircle className="mr-2 h-5 w-5" />
                Sledovat demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8">
              <div>
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-muted-foreground">Aktivních organizací</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">50k+</div>
                <div className="text-muted-foreground">Spokojených studentů</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-muted-foreground">Míra spokojenosti</div>
              </div>
            </div>
          </div>
          
          {/* Visual Content */}
          <div className="relative">
            {/* TODO: Replace with actual hero image or animation */}
            <div className="relative h-[600px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center shadow-soft">
              <div className="text-center space-y-4">
                <div className="h-32 w-32 mx-auto bg-gradient-primary rounded-full flex items-center justify-center mb-8">
                  <Sparkles className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-semibold">AI-Powered Learning</h3>
                <p className="text-muted-foreground">
                  Vizualizace bude přidána
                </p>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white p-4 rounded-lg shadow-soft animate-float">
              <div className="text-sm font-medium">📊 Živá analytika</div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-lg shadow-soft animate-float" style={{animationDelay: '1s'}}>
              <div className="text-sm font-medium">🎯 Personalizace</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};