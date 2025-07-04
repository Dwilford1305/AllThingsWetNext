import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jobs - All Things Wetaskiwin',
  description: 'Find career opportunities and job openings in Wetaskiwin',
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
