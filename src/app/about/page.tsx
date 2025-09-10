import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { Metadata } from 'next';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/Footer';
import ConditionalLayout from '@/components/ConditionalLayout';
import AnimatedSection from '@/components/AnimatedSection';

export const metadata: Metadata = {
  title: 'About All Things Wetaskiwin - Your Community Hub',
  description: 'Learn about All Things Wetaskiwin, developer Derek Wilford, and how this community platform is being built with AI assistance to serve Wetaskiwin, Alberta.',
  keywords: 'About All Things Wetaskiwin, Derek Wilford, derekwilford.ca, AI development, community platform, Wetaskiwin Alberta',
  openGraph: {
    title: 'About All Things Wetaskiwin',
    description: 'Discover the story behind Wetaskiwin\'s community hub and how AI assistance is helping one developer build something great for our community.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
  },
  twitter: {
    card: 'summary',
    title: 'About All Things Wetaskiwin',
    description: 'Learn about our community platform and the developer building it with AI assistance.',
  },
  alternates: {
    canonical: '/about'
  }
};

export default async function AboutPage() {
  const filePath = path.join(process.cwd(), 'public', 'about.md');
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const html = await marked(markdown);

  return (
    <ConditionalLayout>
      <div className="relative">
        <Navigation />
        
        {/* Hero Section */}
        <AnimatedSection delay={0}>
          <div className="relative min-h-[40vh] bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 flex items-center justify-center min-h-[40vh] text-center px-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
                  About Us
                </h1>
                <p className="text-xl text-blue-200 max-w-2xl mx-auto">
                  Learn about All Things Wetaskiwin and the developer working to bring our community together
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Content Section */}
        <AnimatedSection delay={0.1}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        </AnimatedSection>

        <Footer />
      </div>
    </ConditionalLayout>
  );
}