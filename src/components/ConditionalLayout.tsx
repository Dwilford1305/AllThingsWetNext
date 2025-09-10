'use client';

import { usePathname } from 'next/navigation';
import useIsFoldableUnfolded from '../hooks/useIsFoldableUnfolded';
interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout = ({ children }: ConditionalLayoutProps) => {
  const { isFoldableUnfolded, viewportWidth } = useIsFoldableUnfolded();
  const pathname = usePathname();

  // Determine if development banner is showing (only on home page)
  const hasBanner = pathname === '/';
  
  // Adjust padding based on banner presence
  const topPadding = hasBanner ? 'pt-12' : 'pt-0';
  const foldablePadding = isFoldableUnfolded && viewportWidth > 480 ? 'pl-24' : '';

  return (
    <div className={`min-h-screen w-full max-w-full box-border ${topPadding} ${foldablePadding}`}>
      {children}
    </div>
  );
};

export default ConditionalLayout;