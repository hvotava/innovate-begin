/**
 * Feature Grid Component
 * Displays key features of Lector AI platform
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Clock, 
  Shield,
  Zap,
  Target,
  BookOpen
} from 'lucide-react';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  benefits: string[];
}

const features: Feature[] = [
  {
    icon: Brain,
    title: 'AI Personalizace',
    description: 'Kurzy se automaticky přizpůsobují stylu učení každého studenta',
    benefits: ['Adaptivní obtížnost', 'Personalizované cesty', 'Inteligentní doporučení']
  },
  {
    icon: MessageSquare,
    title: 'AI Tutor',
    description: 'Virtuální asistent poskytuje okamžitou podporu 24/7',
    benefits: ['Okamžité odpovědi', 'Vysvětlení konceptů', 'Hlasové interakce']
  },
  {
    icon: BarChart3,
    title: 'Pokročilá Analytika',
    description: 'Detailní vhled do pokroku a výkonnosti studentů',
    benefits: ['Real-time reporting', 'Prediktivní analýzy', 'ROI měření']
  },
  {
    icon: Users,
    title: 'Týmová Spolupráce',
    description: 'Nástroje pro efektivní spolupráci mezi studenty a lektory',
    benefits: ['Skupinové projekty', 'Peer review', 'Diskuzní fóra']
  },
  {
    icon: Clock,
    title: 'Flexibilní Učení',
    description: 'Studujte kdy a kde chcete s mobilní podporou',
    benefits: ['Offline režim', 'Mobilní aplikace', 'Sync napříč zařízeními']
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Nejvyšší úroveň zabezpečení pro firemní data',
    benefits: ['GDPR compliance', 'ISO certifikace', 'End-to-end šifrování']
  },
  {
    icon: Zap,
    title: 'Rychlé Nasazení',
    description: 'Spuštění za méně než 24 hodin s kompletní podporou',
    benefits: ['Guided onboarding', 'Data migrace', 'Technická podpora']
  },
  {
    icon: Target,
    title: 'Cílené Výsledky',
    description: 'Měřitelné zlepšení výsledků učení až o 40%',
    benefits: ['Vyšší dokončenost', 'Lepší výsledky', 'Vyšší engagement']
  },
  {
    icon: BookOpen,
    title: 'Rozsáhlá Knihovna',
    description: 'Tisíce kurzů a vzdělavacích materiálů připravených k použití',
    benefits: ['Pre-built kurzy', 'Template systém', 'Content marketplace']
  }
];

export const FeatureGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <Card 
          key={index} 
          className="group hover:shadow-soft transition-all duration-300 border-0 bg-card/50"
        >
          <CardHeader className="pb-4">
            <div className="mb-4">
              <div className="inline-flex p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {feature.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {feature.description}
            </p>
            
            <ul className="space-y-2">
              {feature.benefits.map((benefit, benefitIndex) => (
                <li key={benefitIndex} className="flex items-center text-sm">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};