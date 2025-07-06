'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Calendar, Newspaper, Building, Briefcase, ShoppingBag } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/businesses', label: 'Businesses', icon: Building },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/classifieds', label: 'Classifieds', icon: ShoppingBag },
  ];

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
    <nav className={`fixed w-full z-50 transition-all duration-300 ${getNavStyles()}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${getTextStyles()} truncate max-w-[200px] sm:max-w-none`}>
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
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 transition-colors ${
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
  );
};

export default Navigation;
