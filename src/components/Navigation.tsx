import { Button } from "@/components/ui/button";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg gradient-ai">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-gradient">
              AI Lecture
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Funkce
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Ceník
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              O nás
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Kontakt
            </a>
            <Button variant="outline" size="sm">
              Přihlásit se
            </Button>
            <Button size="sm" className="gradient-ai text-white border-0">
              Začít zdarma
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Funkce
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Ceník
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                O nás
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Kontakt
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="outline" size="sm">
                  Přihlásit se
                </Button>
                <Button size="sm" className="gradient-ai text-white border-0">
                  Začít zdarma
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};