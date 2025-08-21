/**
 * Stats Bar Component  
 * Displays key platform statistics and achievements
 */

import React from 'react';
import { TrendingUp, Users, BookOpen, Award, Star } from 'lucide-react';

interface Stat {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  trend?: string;
}

const stats: Stat[] = [
  {
    icon: Users,
    value: '50,000+',
    label: 'Aktivních uživatelů',
    trend: '+25% this month'
  },
  {
    icon: BookOpen,
    value: '2,500+',
    label: 'Dostupných kurzů',
    trend: 'Nové každý týden'
  },
  {
    icon: Award,
    value: '95%',
    label: 'Úspěšnost dokončení',
    trend: 'Nad průměrem odvětví'
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Hodnocení uživatelů',
    trend: 'Z 10,000+ recenzí'
  }
];

export const StatsBar: React.FC = () => {
  return (
    <section className="py-16 bg-muted/30 border-y">
      <div className="container-xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Čísla, která{' '}
            <span className="text-gradient-primary">mluví za vše</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tisíce organizací už využívají Lector AI pro transformaci svých vzdělávacích procesů
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="text-center group cursor-pointer"
            >
              {/* Icon */}
              <div className="inline-flex p-4 mb-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              
              {/* Value */}
              <div className="text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {stat.value}
              </div>
              
              {/* Label */}
              <div className="text-lg font-medium text-muted-foreground mb-2">
                {stat.label}
              </div>
              
              {/* Trend */}
              {stat.trend && (
                <div className="flex items-center justify-center text-sm text-success">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.trend}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Trust Indicators */}
        <div className="mt-16 pt-12 border-t border-border/50">
          <p className="text-center text-muted-foreground mb-8">
            Důvěřuje nám více než 500+ organizací včetně:
          </p>
          
          {/* TODO: Add actual customer logos */}
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="px-6 py-3 bg-muted rounded-lg font-medium">
              Univerzita Karlova
            </div>
            <div className="px-6 py-3 bg-muted rounded-lg font-medium">
              České Budějovice
            </div>
            <div className="px-6 py-3 bg-muted rounded-lg font-medium">
              T-Mobile
            </div>
            <div className="px-6 py-3 bg-muted rounded-lg font-medium">
              Škoda Auto
            </div>
            <div className="px-6 py-3 bg-muted rounded-lg font-medium">
              Avast
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};