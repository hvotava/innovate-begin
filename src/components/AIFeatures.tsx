import { Bot, Mic, Brain, Zap, Users, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Bot,
    title: "AI Tutor",
    description: "Inteligentní tutoring systém, který se přizpůsobuje stylu učení každého studenta a poskytuje personalizované vysvětlení.",
    gradient: "from-blue-500 to-purple-600"
  },
  {
    icon: Mic,
    title: "Hlasové hovory",
    description: "Automatické hlasové hovory s pokročilou konverzační AI pro praktické procvičování a interaktivní lekce.",
    gradient: "from-green-500 to-teal-600"
  },
  {
    icon: Brain,
    title: "Adaptivní učení",
    description: "AI analyzuje pokrok studenta a dynamicky upravuje obtížnost a obsah lekcí pro optimální výsledky.",
    gradient: "from-purple-500 to-pink-600"
  },
  {
    icon: Zap,
    title: "Rychlé generování",
    description: "Vytvořte kompletní kurzy s testy a materiály za minuty pomocí pokročilé AI technologie.",
    gradient: "from-orange-500 to-red-600"
  },
  {
    icon: Users,
    title: "Skupinové učení",
    description: "Podpora kolaborativního učení s AI moderátorem pro skupinové diskuze a projekty.",
    gradient: "from-indigo-500 to-blue-600"
  },
  {
    icon: BarChart3,
    title: "Analýzy výkonnosti",
    description: "Detailní přehledy o pokroku studentů s AI doporučeními pro zlepšení výsledků.",
    gradient: "from-teal-500 to-green-600"
  }
];

export const AIFeatures = () => {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-6">
            Výkonné AI funkce pro
            <span className="block text-gradient">moderní vzdělávání</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Objevte, jak naše AI technologie mění způsob, jakým se učíme a vyučujeme. 
            Každá funkce je navržena pro maximální efektivitu a zapojení studentů.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-card transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm border-border/50"
            >
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-heading font-semibold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Demo Section */}
        <div className="mt-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card/30 backdrop-blur-sm rounded-3xl p-8 sm:p-12 border border-border/50">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI v akci
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-bold mb-4">
                  Vyzkoušejte naši AI technologii
                </h3>
                <p className="text-muted-foreground mb-8">
                  Prozkoumajte možnosti našeho AI tutora, který dokáže vysvětlit složité koncepty 
                  jednoduchým způsobem a přizpůsobit se vašemu tempu učení.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-muted/20 rounded-lg p-4">
                  <div className="font-semibold mb-2">Otázka studenta</div>
                  <div className="text-muted-foreground">"Můžeš mi vysvětlit kvantovou fyziku?"</div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full gradient-ai flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="font-semibold mb-2 text-primary">AI odpověď</div>
                  <div className="text-muted-foreground">"Začneme jednoduše. Představ si kvantovou částici jako..."</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};