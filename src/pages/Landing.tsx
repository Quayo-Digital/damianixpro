
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { UserGroupsSection } from "@/components/landing/UserGroupSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CallToActionSection } from "@/components/landing/CallToActionSection";
import { Footer } from "@/components/landing/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HeroSection />
      <UserGroupsSection />
      <TestimonialsSection />
      <section className="py-20 px-6 bg-white">
        <PricingPlans />
      </section>
      <CallToActionSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
