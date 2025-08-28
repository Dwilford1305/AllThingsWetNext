import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Opportunities in Wetaskiwin, Alberta - All Things Wetaskiwin',
  description: 'Discover career opportunities, job openings, and employment listings in Wetaskiwin, Alberta. Find your next career opportunity in our community.',
  keywords: 'Wetaskiwin jobs, Alberta jobs, employment opportunities, career openings, local jobs, job listings',
  openGraph: {
    title: 'Job Opportunities in Wetaskiwin, Alberta',
    description: 'Find career opportunities and employment listings in Wetaskiwin, Alberta.',
    type: 'website',
    locale: 'en_CA',
    siteName: 'All Things Wetaskiwin',
  },
  twitter: {
    card: 'summary',
    title: 'Job Opportunities in Wetaskiwin, Alberta',
    description: 'Discover career opportunities and job openings in Wetaskiwin, Alberta.',
  },
  alternates: {
    canonical: '/jobs'
  }
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
