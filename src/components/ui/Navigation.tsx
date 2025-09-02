'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Menu, X, Home, Calendar, Newspaper, Building, Briefcase, ShoppingBag, Info, Shield, LogIn, UserPlus, LogOut, User } from 'lucide-react';

type UiUser = {
  firstName?: string
  lastName?: string
  profileImage?: string
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
}

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/businesses', label: 'Businesses', icon: Building },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/about', label: 'About', icon: Info },
    ...(isSuperAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const loginHref = '/api/auth/login';
  const signupHref = '/api/auth/login?screen_hint=signup';
  const logoutHref = '/api/auth/logout';

  return (
    <nav className={`navigation ${!isHomePage || isScrolled ? 'navigation-scrolled' : 'navigation-transparent'}`}>
      <div className="site-container">
        <div className="navigation-container">
          {/* Brand */}
          <div className="navigation-brand-container">
            {isScrolled && (
              <Link href="/" className="navigation-brand">
                All Things Wetaskiwin
              </Link>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="navigation-menu-desktop">
            <ul className="navigation-menu">
              {navItems.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`navigation-link ${pathname === href ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span className="navigation-link-text">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* User Menu */}
            <div className="navigation-user">
              {user ? (
                <div className="user-menu">
                  <Link href="/profile" className="user-profile">
                    {displayPicture ? (
                      <Image
                        src={displayPicture}
                        alt={`${displayFirst} ${displayLast}`}
                        width={24}
                        height={24}
                        className="user-avatar"
                      />
                    ) : (
                      <User size={16} />
                    )}
                    <span className="user-name">
                      {displayFirst} {displayLast}
                    </span>
                  </Link>
                  <a href={logoutHref} className="logout-link">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </a>
                </div>
              ) : (
                <div className="auth-buttons">
                  <a href={loginHref} className="button button-secondary">
                    <LogIn size={16} />
                    <span>Login</span>
                  </a>
                  <a href={signupHref} className="button">
                    <UserPlus size={16} />
                    <span>Register</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mobile-menu-button"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-content">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`mobile-menu-link ${pathname === href ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              ))}
              
              {/* Mobile Auth */}
              <div className="mobile-auth">
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="mobile-menu-link"
                      onClick={() => setIsOpen(false)}
                    >
                      {displayPicture ? (
                        <Image
                          src={displayPicture}
                          alt={`${displayFirst} ${displayLast}`}
                          width={20}
                          height={20}
                          className="user-avatar"
                        />
                      ) : (
                        <User size={20} />
                      )}
                      <span>{displayFirst} {displayLast}</span>
                    </Link>
                    <a
                      href={logoutHref}
                      onClick={() => setIsOpen(false)}
                      className="mobile-menu-link logout"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </a>
                  </>
                ) : (
                  <div className="mobile-auth-buttons">
                    <a
                      href={loginHref}
                      onClick={() => setIsOpen(false)}
                      className="button button-secondary mobile-button"
                    >
                      <LogIn size={20} />
                      <span>Login</span>
                    </a>
                    <a
                      href={signupHref}
                      onClick={() => setIsOpen(false)}
                      className="button mobile-button"
                    >
                      <UserPlus size={20} />
                      <span>Register</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
