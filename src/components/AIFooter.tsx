import { Brain, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AIFooter = () => {
  return (
    <footer className="bg-card/50 backdrop-blur-sm border-t border-border/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-lg gradient-ai">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-gradient">
                AI Lecture
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Revoluce ve vzdělávání pomocí umělé inteligence. 
              Vytváříme budoucnost online výuky.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Produkt</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Funkce
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ceník
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  API dokumentace
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Integrace
                </a>
              </li>
            </ul>
          </div>

          {/* Podpora */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Podpora</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Nápověda
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Komunita
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Školení
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Status stránky
                </a>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h4 className="font-heading font-semibold mb-4">Kontakt</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                info@ailecture.cz
              </div>
              <div className="flex items-center text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                +420 123 456 789
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                Praha, Česká republika
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-muted/20 rounded-2xl p-8 mb-12">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-heading font-semibold mb-4">
              Zůstaňte v obraze
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Přihlaste se k odběru našeho newsletteru a získejte nejnovější 
              informace o AI technologiích ve vzdělávání.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Váš email"
                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-sm"
              />
              <Button className="gradient-ai text-white border-0">
                Přihlásit se
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2024 AI Lecture. Všechna práva vyhrazena.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Ochrana soukromí
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Podmínky použití
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};