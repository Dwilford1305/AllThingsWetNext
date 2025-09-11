import Navigation from '@/components/ui/Navigation';
import ParallaxHero from '@/components/ParallaxHero';
import Dashboard from '@/components/Dashboard';
import CommunityStats from '@/components/CommunityStats';
import SubscriptionShowcase from '@/components/SubscriptionShowcase';
import Footer from '@/components/Footer';
import AnimatedSection from '@/components/AnimatedSection';
import AdPlaceholder from '@/components/AdPlaceholder';
import { BusinessAdRotator } from '@/components/BusinessAdRotator';
import FoldableLayout from '@/components/FoldableLayout';

export default function Home() {
  return (
    <FoldableLayout>
      <div className="relative">
        <Navigation />
        <ParallaxHero />
      
      {/* Top Banner Ad - High visibility */}
      <AnimatedSection delay={0}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-4 lg:py-6">
          <AdPlaceholder 
            type="google" 
            size="leaderboard" 
            className="w-full max-w-4xl mx-auto" 
          />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <Dashboard />
      </AnimatedSection>

      {/* Platinum Tier - Premium positioning near top */}
      <AnimatedSection delay={0.15}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Premium Business Spotlight</h3>
            <p className="text-sm text-gray-300">Experience the highest tier of business promotion</p>
          </div>
          <div className="flex justify-center">
            <BusinessAdRotator 
              tier="platinum"
              className="w-full max-w-md h-64 sm:h-72"
            />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <CommunityStats />
      </AnimatedSection>

      {/* Gold Tier - Featured placement in middle */}
      <AnimatedSection delay={0.25}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Featured Businesses</h3>
            <p className="text-sm text-gray-300">Gold tier businesses with enhanced visibility</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <BusinessAdRotator 
              tier="gold"
              className="h-20 sm:h-24"
            />
            <BusinessAdRotator 
              tier="gold"
              className="h-20 sm:h-24"
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Mid-page Google Ad */}
      <AnimatedSection delay={0.3}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4">
          <AdPlaceholder 
            type="google" 
            size="banner" 
            className="w-full max-w-2xl mx-auto" 
          />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.32}>
        <SubscriptionShowcase />
      </AnimatedSection>

      {/* Silver Tier - Enhanced listings toward bottom */}
      <AnimatedSection delay={0.35}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-1 sm:mb-2">Enhanced Local Listings</h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-300">Discover silver tier enhanced business listings</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <BusinessAdRotator 
              tier="silver"
              className="h-48 sm:h-52"
            />
            <BusinessAdRotator 
              tier="silver"
              className="h-48 sm:h-52"
            />
            <BusinessAdRotator 
              tier="silver"
              className="h-48 sm:h-52"
            />
            <BusinessAdRotator 
              tier="silver"
              className="h-48 sm:h-52"
            />
          </div>
        </div>
      </AnimatedSection>

      <Footer />
      </div>
    </FoldableLayout>
  );
}
