/**
 * Home Page - Lector AI Landing Page
 * Main marketing page with hero, features, and CTA sections
 */

import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { FeatureGrid } from '@/components/FeatureGrid';
import { StatsBar } from '@/components/StatsBar';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, Zap } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Stats Bar */}
      <StatsBar />
      
      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/50">
        <div className="container-xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Revoluce ve vzdělávání pomocí{' '}
              <span className="text-gradient-primary">umělé inteligence</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Lector AI přináší personalizované učení, inteligentní hodnocení a pokročilou analytiku
              pro moderní vzdělávací instituce a organizace.
            </p>
          </div>
          
          <FeatureGrid />
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24">
        <div className="container-xl">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6">
              Připraveni začít s{' '}
              <span className="text-gradient-primary">Lector AI</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Připojte se k tisícům organizací, které už využívají sílu AI pro vzdělávání
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gradient-primary text-white">
                Spustit aplikaci
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline">
                Zjistit více
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg gradient-primary">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Lector AI</span>
              </div>
              <p className="text-muted-foreground">
                Budoucnost vzdělávání pomocí umělé inteligence
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Funkce</a></li>
                <li><a href="/pricing" className="hover:text-foreground">Ceník</a></li>
                <li><a href="/references" className="hover:text-foreground">Reference</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Společnost</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">O nás</a></li>
                <li><a href="#" className="hover:text-foreground">Kariéra</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Podpora</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Dokumentace</a></li>
                <li><a href="#" className="hover:text-foreground">Kontakt</a></li>
                <li><a href="#" className="hover:text-foreground">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Lector AI. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;