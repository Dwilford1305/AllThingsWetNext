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
      
      {/* Top Banner Ad - Full width, horizontally centered */}
      <AnimatedSection delay={0}>
        <div className="w-full px-2 sm:px-4 py-2 sm:py-4 lg:py-6">
          <div className="flex justify-center">
            <AdPlaceholder 
              type="google" 
              size="leaderboard" 
              className="w-full max-w-full" 
            />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <Dashboard />
      </AnimatedSection>

      {/* Platinum Tier - Premium positioning, full width */}
      <AnimatedSection delay={0.15}>
        <div className="w-full px-2 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Premium Business Spotlight</h3>
            <p className="text-sm text-gray-300">Experience the highest tier of business promotion</p>
          </div>
          <div className="flex justify-center">
            <BusinessAdRotator 
              tier="platinum"
              className="w-full max-w-full"
            />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <CommunityStats />
      </AnimatedSection>

      {/* Gold Tier - Featured placement, full width */}
      <AnimatedSection delay={0.25}>
        <div className="w-full px-2 sm:px-4 py-3 sm:py-4 lg:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Featured Businesses</h3>
            <p className="text-sm text-gray-300">Gold tier businesses with enhanced visibility</p>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-full">
              <BusinessAdRotator 
                tier="gold"
                className="w-full"
              />
              <BusinessAdRotator 
                tier="gold"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Mid-page Google Ad - Full width */}
      <AnimatedSection delay={0.3}>
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3 lg:py-4">
          <div className="flex justify-center">
            <AdPlaceholder 
              type="google" 
              size="banner" 
              className="w-full max-w-full" 
            />
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.32}>
        <SubscriptionShowcase />
      </AnimatedSection>

      {/* Silver Tier - Enhanced listings, full width */}
      <AnimatedSection delay={0.35}>
        <div className="w-full px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="text-center mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-1 sm:mb-2">Enhanced Local Listings</h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-300">Discover silver tier enhanced business listings</p>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 w-full max-w-full">
              <BusinessAdRotator 
                tier="silver"
                className="w-full"
              />
              <BusinessAdRotator 
                tier="silver"
                className="w-full"
              />
              <BusinessAdRotator 
                tier="silver"
                className="w-full"
              />
              <BusinessAdRotator 
                tier="silver"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <Footer />
      </div>
    </FoldableLayout>
  );
}
