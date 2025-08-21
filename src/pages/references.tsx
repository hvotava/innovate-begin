/**
 * References Page - Customer Success Stories
 * TODO: Implement ReferenceCard components and testimonials
 */

import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote } from 'lucide-react';

const References: React.FC = () => {
  // TODO: Replace with actual customer data from API
  const testimonials = [
    {
      name: 'Jana Nováková',
      role: 'HR ředitelka',
      company: 'TechCorp s.r.o.',
      avatar: '',
      rating: 5,
      text: 'Lector AI zcela změnil způsob, jakým školíme naše zaměstnance. Personalizované kurzy a AI hodnocení ušetřily desítky hodin týdně.',
    },
    {
      name: 'Petr Svoboda',
      role: 'Rektor',
      company: 'Univerzita Karlova',
      avatar: '',
      rating: 5,
      text: 'Studenti jsou mnohem více zapojeni díky interaktivním AI tutorům. Výsledky zlepšení jsou viditelné už po prvním semestru.',
    },
    {
      name: 'Marie Černá', 
      role: 'Ředitelka vzdělávání',
      company: 'Global Education',
      avatar: '',
      rating: 5,
      text: 'Analytika a reporty poskytují nevídaný vhled do pokroku studentů. Můžeme reagovat na problémy dřív, než se stanou kritickými.',
    },
  ];

  const stats = [
    { number: '500+', label: 'Spokojených zákazníků' },
    { number: '50k+', label: 'Aktivních studentů' },
    { number: '95%', label: 'Míra spokojenosti' },
    { number: '40%', label: 'Zlepšení výsledků' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="container-xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">
              Naši zákazníci{' '}
              <span className="text-gradient-primary">milují</span> Lector AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Přečtěte si příběhy úspěšných organizací, které využívají Lector AI 
              k revoluci ve vzdělávání svých zaměstnanců a studentů.
            </p>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
          
          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-warning fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback>
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Case Studies Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">
              Detailní případové studie
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Podívejte se na konkrétní výsledky, kterých naši zákazníci dosáhli 
              s pomocí Lector AI platformy.
            </p>
            
            {/* TODO: Add case study cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-4">TechCorp - 40% zlepšení efektivity</h3>
                  <p className="text-muted-foreground">
                    Jak technologická společnost zvýšila efektivitu školení pomocí AI personalizace...
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-4">Univerzita - 95% spokojenost studentů</h3>
                  <p className="text-muted-foreground">
                    Příběh implementace AI tutorů na vysoké škole s tisíci studentů...
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default References;