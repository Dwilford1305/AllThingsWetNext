'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Calendar, Newspaper, Building, Briefcase, ShoppingBag } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleResize = () => {
      const newWidth = window.innerWidth;
      setViewportWidth(newWidth);
      // Close mobile menu on resize to larger screen
      if (newWidth >= 768) {
        setIsOpen(false);
      }
    };

    // Set initial viewport width with a small delay to ensure proper hydration
    const setInitialWidth = () => {
      if (typeof window !== 'undefined') {
        setViewportWidth(window.innerWidth);
      }
    };

    // Set immediately and after a brief delay for safety
    setInitialWidth();
    setTimeout(setInitialWidth, 100);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/businesses', label: 'Businesses', icon: Building },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/classifieds', label: 'Classifieds', icon: ShoppingBag },
  ];

  // Detect if device is likely a foldable in unfolded state
  const isFoldableUnfolded = () => {
    if (viewportWidth === 0) return false;
    
    // Primary detection based on known foldable widths
    const isDefinitelyFoldable = (
      (viewportWidth >= 650 && viewportWidth <= 690) || // Pixel Fold, OnePlus Open, Honor Magic V, Motorola Razr+ (expanded range)
      (viewportWidth >= 715 && viewportWidth <= 735) || // Surface Duo range (expanded)
      (viewportWidth >= 740 && viewportWidth <= 785) || // Samsung Z Fold series, Xiaomi, Huawei (expanded)
      (viewportWidth >= 840 && viewportWidth <= 860)    // Pixel 9 Pro Fold (851px)
    );
    
    // Secondary detection: aspect ratio-based for unfolded devices
    // Foldables typically have wide aspect ratios when unfolded
    const aspectRatioDetection = () => {
      if (typeof window === 'undefined') return false;
      const aspectRatio = window.innerWidth / window.innerHeight;
      // Adjusted for Pixel 9 Pro Fold (1.21 ratio) and other foldables
      return aspectRatio > 1.15 && aspectRatio < 2.1 && viewportWidth >= 640 && viewportWidth <= 900;
    };
    
    const isFoldable = isDefinitelyFoldable || aspectRatioDetection();
    
    // Debug logging for development - always show for now to help identify your device
    console.log('Navigation detection:', { 
      viewportWidth, 
      aspectRatio: typeof window !== 'undefined' ? (window.innerWidth / window.innerHeight).toFixed(2) : 'N/A',
      isDefinitelyFoldable, 
      aspectRatioDetection: aspectRatioDetection(),
      finalResult: isFoldable 
    });
    
    return isFoldable;
  };

  // Get dynamic max width based on viewport
  const getTitleMaxWidth = () => {
    // If viewport width is not set yet, use a safe default for mobile
    if (viewportWidth === 0) return 'max-w-[140px] sm:max-w-none';
    
    if (viewportWidth <= 344) return 'max-w-[100px]'; // Pixel 9 Pro Fold cover
    if (viewportWidth <= 380) return 'max-w-[120px]'; // Very narrow foldables
    if (viewportWidth <= 390) return 'max-w-[130px]'; // iPhone 12 Pro
    if (viewportWidth <= 475) return 'max-w-[140px]'; // Small phones
    return 'max-w-[180px] sm:max-w-none'; // Normal responsive behavior
  };

  // For non-home pages, always show solid background
  // For home page, use transparent when at top
  const getNavStyles = () => {
    if (!isHomePage) {
      return 'bg-white/95 backdrop-blur-md shadow-lg border-b';
    }
    return isScrolled 
      ? 'bg-white/95 backdrop-blur-md shadow-lg border-b' 
      : 'bg-transparent';
  };

  const getTextStyles = () => {
    if (!isHomePage) {
      return 'text-gray-900';
    }
    return isScrolled ? 'text-gray-900' : 'text-white';
  };

  return (
    <>
      {/* Foldable Sidebar Navigation */}
      {isFoldableUnfolded() && (
        <aside className="fixed left-0 top-0 h-full w-24 bg-white/95 backdrop-blur-md shadow-lg border-r z-40 flex flex-col items-center py-4 foldable-sidebar">
          {/* Logo/Home */}
          <Link href="/" className="mb-6 p-2 rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-1">
              <Home size={18} className="text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">Home</span>
          </Link>
          
          {/* Navigation Items */}
          <nav className="flex flex-col space-y-2 flex-1">
            {navItems.slice(1).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`p-2 rounded-lg transition-colors group relative flex flex-col items-center ${
                  pathname === href 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
                title={label}
              >
                <Icon size={18} className="mb-1" />
                <span className={`text-xs font-medium leading-tight text-center ${
                  pathname === href ? 'text-white' : 'text-gray-700'
                }`}>
                  {label}
                </span>
              </Link>
            ))}
          </nav>
        </aside>
      )}

      {/* Traditional Navigation for non-foldable devices */}
      <nav className={`fixed w-full max-w-full z-50 transition-all duration-300 nav-container overflow-x-hidden ${getNavStyles()} ${isFoldableUnfolded() ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 overflow-x-hidden">
          <div className="flex justify-between items-center h-14 sm:h-16 min-w-0 flex-between w-full overflow-x-hidden">
            <div className="flex items-center min-w-0 flex-1 mr-3 overflow-x-hidden">
              <Link href="/" className="flex-shrink-0 min-w-0 overflow-x-hidden">
                <h1 className={`nav-title text-lg sm:text-xl font-bold transition-colors duration-300 ${getTextStyles()} truncate ${getTitleMaxWidth()} overflow-x-hidden`}>
                  All Things Wetaskiwin
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    !isHomePage || isScrolled
                      ? 'text-gray-600 hover:text-blue-600' 
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center flex-shrink-0">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 min-w-[44px] min-h-[44px] transition-colors touch-manipulation ${
                  !isHomePage || isScrolled
                    ? 'text-gray-600 hover:text-blue-600' 
                    : 'text-white/90 hover:text-white'
                }`}
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md border-t max-h-[calc(100vh-3.5rem)] overflow-y-auto">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
