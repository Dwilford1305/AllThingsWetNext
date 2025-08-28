import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About All Things Wetaskiwin - Your Community Hub',
  description: 'Learn about All Things Wetaskiwin, developer Derek Wilford, and how this community platform was built with AI assistance to serve Wetaskiwin, Alberta.',
  keywords: 'About All Things Wetaskiwin, Derek Wilford, derekwilford.ca, GitHub Copilot, AI development, community platform, Wetaskiwin Alberta',
  openGraph: {
    title: 'About All Things Wetaskiwin',
    description: 'Discover the story behind Wetaskiwin\'s community hub and how AI assistance is revolutionizing local development.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
  },
  twitter: {
    card: 'summary',
    title: 'About All Things Wetaskiwin',
    description: 'Learn about our community platform and the power of AI-assisted development.',
  },
  alternates: {
    canonical: '/about'
  }
};

export default function AboutPage() {
  const filePath = path.join(process.cwd(), 'public', 'about.md');
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const html = marked(markdown);

  return (
    <main className="prose mx-auto p-6">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}