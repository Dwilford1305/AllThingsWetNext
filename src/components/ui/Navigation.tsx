'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Menu, X, Home, Calendar, Newspaper, Building, Briefcase, ShoppingBag, Shield, LogIn, UserPlus, LogOut, User } from 'lucide-react';

type UiUser = {
  firstName?: string
  lastName?: string
  profileImage?: string
  // Auth0 fields
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
}

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { user } = useUser() as { user: UiUser | undefined }
  const [profFirst, setProfFirst] = useState<string>('')
  const [profLast, setProfLast] = useState<string>('')
  const [profPic, setProfPic] = useState<string>('')
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false)

  const fallbackFirst = user?.firstName || user?.given_name || (user?.name ? String(user.name).split(' ')[0] : '')
  const fallbackLast = user?.lastName || user?.family_name || (user?.name ? String(user.name).split(' ').slice(1).join(' ') : '')
  const fallbackPic = user?.profileImage || user?.picture
  const displayFirst = profFirst || fallbackFirst
  const displayLast = profLast || fallbackLast
  const displayPicture = profPic || fallbackPic

  useEffect(() => {
    // Fetch enriched profile (role, names, picture) when logged in
    let cancelled = false
    const load = async () => {
      try {
        if (!user) return
        const res = await fetch('/api/auth/profile', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        const d = data?.data || {}
        if (cancelled) return
        if (d.firstName) setProfFirst(String(d.firstName))
        if (d.lastName) setProfLast(String(d.lastName))
        if (d.profileImage) setProfPic(String(d.profileImage))
        if (d.role === 'super_admin') setIsSuperAdmin(true)
      } catch { /* noop */ }
    }
    load()
    return () => { cancelled = true }
  }, [user])

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

    setHasMounted(true);
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
    // Only show admin link for super admins
    ...(isSuperAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  // Prefer anchor navigation for reliability over programmatic redirects
  const loginHref = '/api/auth/login';
  const signupHref = '/api/auth/login?screen_hint=signup';
  const logoutHref = '/api/auth/logout';

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
      return 'glass border border-white/10 shadow-glass';
    }
    return isScrolled 
      ? 'glass border border-white/10 shadow-glass' 
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
      {/* Foldable Sidebar Navigation (client-only) */}
      {hasMounted && isFoldableUnfolded() && (
        <aside className="fixed left-0 top-20 sm:top-16 md:top-12 bottom-0 w-24 bg-white/80 backdrop-blur-lg border-r border-gray-200/50 shadow-xl z-40 flex flex-col items-center py-6 foldable-sidebar overflow-y-auto">
          {/* Logo/Home */}
          <Link href="/" className="mb-6 p-3 rounded-xl hover:bg-blue-50 transition-all duration-300 hover-lift flex flex-col items-center flex-shrink-0 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
              <Home size={20} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">Home</span>
          </Link>
          
          {/* Navigation Items */}
          <nav className="flex flex-col space-y-2 flex-1 min-h-0">
            {navItems.slice(1).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`p-3 rounded-xl transition-all duration-300 hover-lift group relative flex flex-col items-center flex-shrink-0 ${
                  pathname === href 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
                title={label}
              >
                <Icon size={20} className="mb-2 group-hover:scale-110 transition-transform duration-300" />
                <span className={`text-xs font-semibold leading-tight text-center transition-colors duration-300 ${
                  pathname === href ? 'text-white' : 'text-gray-800 group-hover:text-blue-600'
                }`}>
                  {label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Authentication Section - Fixed at bottom */}
          <div className="mt-auto pt-4 border-t border-gray-200/50 flex flex-col space-y-3 flex-shrink-0">
      {user ? (
              <>
                {/* User Profile - Clickable */}
                <Link
                  href="/profile"
                  className="p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 flex flex-col items-center text-center flex-shrink-0 transition-all duration-300 hover-lift group"
                  title="Profile Settings"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
          {displayPicture ? (
                      <Image
            src={displayPicture}
            alt={`${displayFirst} ${displayLast}`}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-white" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight text-center group-hover:text-blue-600 transition-colors duration-300">
          {displayFirst}
                  </span>
                </Link>
                
                {/* Logout Button */}
                <a
                  href={logoutHref}
                  className="p-2 rounded-lg transition-colors group relative flex flex-col items-center flex-shrink-0 text-gray-700 hover:bg-red-50 hover:text-red-600"
                  title="Logout"
                >
                  <LogOut size={18} className="mb-1" />
                  <span className="text-xs font-medium leading-tight text-center text-gray-800">
                    Logout
                  </span>
                </a>
              </>
            ) : (
              <>
                {/* Login Button */}
                <a
                  href={loginHref}
                  className="p-2 rounded-lg transition-colors group relative flex flex-col items-center flex-shrink-0 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  title="Login"
                >
                  <LogIn size={18} className="mb-1 text-gray-800" />
                  <span className="text-xs font-medium leading-tight text-center text-gray-800">
                    Login
                  </span>
                </a>
                
                {/* Register Button */}
                <a
                  href={signupHref}
                  className="p-2 rounded-lg transition-colors group relative flex flex-col items-center flex-shrink-0 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  title="Register"
                >
                  <UserPlus size={18} className="mb-1 text-gray-800" />
                  <span className="text-xs font-medium leading-tight text-center text-gray-800">
                    Register
                  </span>
                </a>
              </>
            )}
          </div>
        </aside>
      )}

      {/* Traditional Navigation for non-foldable devices (always rendered) */}
      <nav className={`fixed w-full max-w-full top-20 sm:top-16 md:top-12 z-40 transition-all duration-500 nav-container overflow-x-hidden no-horizontal-scroll safe-width rounded-b-2xl` +
        ` ${getNavStyles()} ${hasMounted && isFoldableUnfolded() ? 'hidden' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden no-horizontal-scroll safe-width">
          <div className="flex justify-between items-center h-16 sm:h-18 min-w-0 flex-between w-full overflow-x-hidden no-horizontal-scroll safe-width">
            <div className="flex items-center min-w-0 flex-1 mr-3 overflow-x-hidden no-horizontal-scroll safe-width">
              {/* Heading only appears after scroll and after mount */}
              {hasMounted && isScrolled && (
                <Link href="/" className="flex-shrink-0 min-w-0 overflow-x-hidden no-horizontal-scroll safe-width group">
                  <h1 className={`nav-title text-2xl sm:text-3xl md:text-3xl font-bold transition-all duration-300 ${getTextStyles()} truncate ${getTitleMaxWidth()} overflow-x-hidden no-horizontal-scroll safe-width group-hover:scale-105`}>
                    All Things Wetaskiwin
                  </h1>
                </Link>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover-lift group ${
                    pathname === href 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : !isHomePage || (hasMounted && isScrolled)
                        ? 'text-gray-700 hover:bg-white/20 hover:text-blue-600' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} className="group-hover:scale-110 transition-transform duration-300" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              ))}
              
              {/* Authentication Buttons */}
              <div className="flex items-center space-x-3 ml-6">
                {user ? (
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/profile"
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors hover:bg-gray-100 ${
                        !isHomePage || (hasMounted && isScrolled)
                          ? 'text-gray-700 hover:text-blue-600' 
                          : 'text-white/90 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {displayPicture ? (
                        <Image
                          src={displayPicture}
                          alt={`${displayFirst} ${displayLast}`}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} />
                      )}
                        <span className="hidden lg:inline text-sm">
                          {displayFirst} {displayLast}
                      </span>
                        <span className="lg:hidden text-sm">
                          {displayFirst}
                      </span>
                    </Link>
                    <a
                      href={logoutHref}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        !isHomePage || (hasMounted && isScrolled)
                          ? 'text-gray-600 hover:text-red-600' 
                          : 'text-white/90 hover:text-white'
                      }`}
                    >
                      <LogOut size={16} />
                      <span className="hidden lg:inline">Logout</span>
                    </a>
                  </div>
                ) : (
                  <>
                    <a
                      href={loginHref}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        !isHomePage || (hasMounted && isScrolled)
                          ? 'text-gray-600 hover:text-blue-600' 
                          : 'text-white/90 hover:text-white'
                      }`}
                    >
                      <LogIn size={16} />
                      <span className="hidden lg:inline">Login</span>
                    </a>
                    <button
                      onClick={(e) => { e.preventDefault(); window.location.href = signupHref; }}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 border ${
                        !isHomePage || (hasMounted && isScrolled)
                          ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white' 
                          : 'border-white text-white hover:bg-white hover:text-gray-900'
                      }`}
                    >
                      <UserPlus size={16} />
                      <span className="hidden lg:inline">Register</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center flex-shrink-0">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 min-w-[44px] min-h-[44px] transition-colors touch-manipulation ${
                  !isHomePage || (hasMounted && isScrolled)
                    ? 'text-gray-900 hover:text-blue-600' 
                    : 'text-white hover:text-white'
                }`}
                aria-label="Toggle navigation menu"
              >
                {isOpen 
                  ? <X size={24} color={(!isHomePage || (hasMounted && isScrolled)) ? undefined : '#fff'} /> 
                  : <Menu size={24} color={(!isHomePage || (hasMounted && isScrolled)) ? undefined : '#fff'} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md border-t max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
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
              
              {/* Mobile Authentication */}
              <div className="border-t pt-3 mt-3">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="w-full text-left text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      {displayPicture ? (
                        <Image
                          src={displayPicture}
                          alt={`${displayFirst} ${displayLast}`}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} />
                      )}
                      <span className="font-medium">
                        {displayFirst} {displayLast}
                      </span>
                    </Link>
                    <a
                      href={logoutHref}
                      onClick={() => setIsOpen(false)}
                      className="w-full text-left text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2"
                    >
                      <LogOut size={20} />
                      Logout
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href={loginHref}
                      onClick={() => setIsOpen(false)}
                      className="w-full text-left text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2"
                    >
                      <LogIn size={20} />
                      Login
                    </a>
                    <a
                      href={signupHref}
                      onClick={() => setIsOpen(false)}
                      className="w-full text-left text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center gap-2 border border-blue-600 mt-2"
                    >
                      <UserPlus size={20} />
                      Register
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

  {/* Auth0 handles authentication modals and redirects */}
    </>
  );
};

export default Navigation;
