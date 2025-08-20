import { Navigation } from "@/components/Navigation";
import { AIHero } from "@/components/AIHero";
import { AIFeatures } from "@/components/AIFeatures";
import { AIPricing } from "@/components/AIPricing";
import { AIFooter } from "@/components/AIFooter";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <AIHero />
      <AIFeatures />
      <AIPricing />
      <AIFooter />
    </div>
  );
};

export default Index;