import Navigation from '@/components/ui/Navigation';
import ModernHero from '@/components/ModernHero';
import Dashboard from '@/components/Dashboard';
import CommunityStats from '@/components/CommunityStats';
import SubscriptionShowcase from '@/components/SubscriptionShowcase';
import Footer from '@/components/Footer';
import AnimatedSection from '@/components/AnimatedSection';
import AdPlaceholder from '@/components/AdPlaceholder';
import FoldableLayout from '@/components/FoldableLayout';

export default function Home() {
  return (
    <FoldableLayout>
      <div className="site-layout">
        <Navigation />
        <ModernHero />
      
        {/* Top Banner Ad */}
        <AnimatedSection delay={0}>
          <section className="section-sm">
            <div className="site-container">
              <AdPlaceholder 
                type="google" 
                size="leaderboard" 
                className="ad-banner" 
              />
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <Dashboard />
        </AnimatedSection>

        {/* Premium Business Spotlight */}
        <AnimatedSection delay={0.15}>
          <section className="section-sm premium-section">
            <div className="site-container">
              <div className="content-header">
                <h3>Premium Business Spotlight</h3>
                <p>Experience the highest tier of business promotion</p>
              </div>
              <div className="spotlight-container">
                <AdPlaceholder 
                  type="platinum" 
                  size="large" 
                  className="premium-ad" 
                />
              </div>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <CommunityStats />
        </AnimatedSection>

        {/* Featured Businesses */}
        <AnimatedSection delay={0.25}>
          <section className="section-sm featured-section">
            <div className="site-container">
              <div className="content-header">
                <h3>Featured Businesses</h3>
                <p>Gold tier businesses with enhanced visibility</p>
              </div>
              <div className="grid grid-2 featured-grid">
                <AdPlaceholder 
                  type="gold" 
                  size="square" 
                />
                <AdPlaceholder 
                  type="gold" 
                  size="square" 
                />
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Mid-page Ad */}
        <AnimatedSection delay={0.3}>
          <section className="section-sm">
            <div className="site-container">
              <AdPlaceholder 
                type="google" 
                size="banner" 
                className="ad-banner-small" 
              />
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.32}>
          <SubscriptionShowcase />
        </AnimatedSection>

        {/* Enhanced Local Listings */}
        <AnimatedSection delay={0.35}>
          <section className="section enhanced-section">
            <div className="site-container">
              <div className="content-header">
                <h3>Enhanced Local Listings</h3>
                <p>Discover silver tier enhanced business listings</p>
              </div>
              <div className="grid grid-4 enhanced-grid">
                <AdPlaceholder type="silver" size="square" />
                <AdPlaceholder type="silver" size="square" />
                <AdPlaceholder type="silver" size="square" />
                <AdPlaceholder type="silver" size="square" />
              </div>
            </div>
          </section>
        </AnimatedSection>

        <Footer />
      </div>
    </FoldableLayout>
  );
}
