import Navbar from "@/components/landing/navbar";
import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/features-section";
import SocialProofSection from "@/components/landing/social-proof-section";
import HowItWorksSection from "@/components/landing/how-it-works-section";

export default function Home() {
  return (
    <>
      <Navbar />
      <main
        className="relative bg-gradient-to-b from-[#fafbfc] to-white"
        role="main"
      >
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>
    </>
  );
}
