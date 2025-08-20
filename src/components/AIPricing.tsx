import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Sparkles, Crown, Rocket } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Zdarma",
    description: "Ideální pro začínající učitele",
    icon: Sparkles,
    features: [
      "5 AI lekcí měsíčně",
      "Základní hlasové hovory",
      "Komunitní podpora",
      "Základní analytiky"
    ],
    buttonText: "Začít zdarma",
    popular: false
  },
  {
    name: "Professional", 
    price: "990 Kč",
    description: "Pro profesionální učitele a školy",
    icon: Crown,
    features: [
      "Neomezené AI lekce",
      "Pokročilé hlasové hovory",
      "Prioritní podpora",
      "Detailní analytiky",
      "Vlastní branding",
      "API přístup"
    ],
    buttonText: "Vyzkoušet zdarma",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Na míru",
    description: "Pro velké organizace",
    icon: Rocket,
    features: [
      "Vše z Professional",
      "Vlastní AI model",
      "Dedikovaný support",
      "SSO integrace",
      "Pokročilé zabezpečení",
      "Školení týmu"
    ],
    buttonText: "Kontaktovat nás",
    popular: false
  }
];

export const AIPricing = () => {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold mb-6">
            Jednoduché a transparentní
            <span className="block text-gradient">ceníky</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vyberte si plán, který nejlépe vyhovuje vašim potřebám. 
            Všechny plány zahrnují nejnovější AI technologie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative transition-all duration-300 hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-primary shadow-ai scale-105' 
                  : 'border-border/50 hover:shadow-card'
              } bg-card/50 backdrop-blur-sm`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="gradient-ai text-white px-4 py-1 rounded-full text-sm font-medium">
                    Nejpopulárnější
                  </div>
                </div>
              )}

              <CardHeader className="text-center p-8">
                <div className="mb-4">
                  <div className={`inline-flex p-4 rounded-2xl ${
                    plan.popular 
                      ? 'gradient-ai' 
                      : 'bg-muted/20'
                  }`}>
                    <plan.icon className={`h-8 w-8 ${
                      plan.popular ? 'text-white' : 'text-primary'
                    }`} />
                  </div>
                </div>
                <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gradient">{plan.price}</span>
                  {plan.price !== "Zdarma" && plan.price !== "Na míru" && (
                    <span className="text-muted-foreground">/měsíc</span>
                  )}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-success mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'gradient-ai text-white border-0 shadow-ai' 
                      : ''
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Preview */}
        <div className="mt-20 text-center">
          <div className="max-w-2xl mx-auto bg-card/30 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
            <h3 className="text-xl font-heading font-semibold mb-4">
              Máte otázky?
            </h3>
            <p className="text-muted-foreground mb-6">
              Všechny plány zahrnují 14denní zkušební období zdarma. 
              Žádné skryté poplatky, můžete kdykoliv zrušit.
            </p>
            <Button variant="outline">
              Zobrazit FAQ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};