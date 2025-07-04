import Navigation from '@/components/ui/Navigation';
import ParallaxHero from '@/components/ParallaxHero';
import Dashboard from '@/components/Dashboard';
import CommunityStats from '@/components/CommunityStats';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';
import AnimatedSection from '@/components/AnimatedSection';

export default function Home() {
  return (
    <>
      <Navigation />
      <ParallaxHero />
      <AnimatedSection>
        <Dashboard />
      </AnimatedSection>
      <AnimatedSection delay={0.2}>
        <CommunityStats />
      </AnimatedSection>
      <AnimatedSection delay={0.3}>
        <CallToAction />
      </AnimatedSection>
      <Footer />
    </>
  );
}
