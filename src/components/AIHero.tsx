import { Button } from "@/components/ui/button";
import { Play, Sparkles, Brain, Mic } from "lucide-react";

export const AIHero = () => {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto text-center">
        {/* Floating AI Icons */}
        <div className="relative mb-8">
          <div className="absolute top-0 left-1/4 animate-float">
            <div className="p-3 rounded-full bg-primary/10 backdrop-blur-sm">
              <Brain className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="absolute top-12 right-1/4 animate-float" style={{animationDelay: '2s'}}>
            <div className="p-3 rounded-full bg-accent/20 backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <div className="absolute -top-4 right-1/3 animate-float" style={{animationDelay: '4s'}}>
            <div className="p-3 rounded-full bg-success/10 backdrop-blur-sm">
              <Mic className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold mb-6 leading-tight">
            Revolucionizujte
            <span className="block text-gradient">
              vzdělávání s AI
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Moderní platforma pro online výuku s umělou inteligencií, 
            hlasovými hovory a adaptivním učením. Vytvořte personalizované 
            lekce za minuty, ne hodiny.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button 
            size="lg" 
            className="gradient-ai text-white border-0 shadow-ai px-8 py-6 text-lg font-semibold"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Začít zdarma
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8 py-6 text-lg"
          >
            <Play className="mr-2 h-5 w-5" />
            Sledovat demo
          </Button>
        </div>

        {/* Neural Network Animation */}
        <div className="relative max-w-3xl mx-auto">
          <div className="h-64 sm:h-80 rounded-2xl gradient-neural animate-neural bg-300% shadow-neural relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white/90 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 animate-glow" />
                <p className="text-lg font-semibold">AI Neural Engine</p>
                <p className="text-sm opacity-75">Adaptivní učení v reálném čase</p>
              </div>
            </div>
            
            {/* Floating dots for neural network effect */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/50 rounded-full animate-glow" style={{animationDelay: '1s'}} />
            <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white/50 rounded-full animate-glow" style={{animationDelay: '2s'}} />
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white/50 rounded-full animate-glow" style={{animationDelay: '3s'}} />
            <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-white/50 rounded-full animate-glow" style={{animationDelay: '0.5s'}} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto mt-16">
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient">10k+</div>
            <div className="text-sm text-muted-foreground">Aktivních studentů</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient">500+</div>
            <div className="text-sm text-muted-foreground">Škol</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient">95%</div>
            <div className="text-sm text-muted-foreground">Úspěšnost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient">24/7</div>
            <div className="text-sm text-muted-foreground">AI podpora</div>
          </div>
        </div>
      </div>
    </section>
  );
};