import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import PublicDashboardPreview from "./components/PublicDashboardPreview";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import HeroSection from "./components/HeroSection";
// import FeaturesSection from "./components/FeaturesSection";
// import HowItWorksSection from "./components/HowItWorksSection";
// import PublicDashboardPreview from "./components/PublicDashboardPreview";
// import SocialProofSection from "./components/SocialProofSection";

export default function HomepagePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PublicDashboardPreview />
        {/* <SocialProofSection /> */}
      </main>
      <Footer />
    </>
  );
}
