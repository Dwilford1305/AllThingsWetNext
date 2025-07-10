'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Building, Briefcase, ShoppingBag, Mail, MapPin, Twitter, Instagram, Newspaper } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/businesses', label: 'Businesses', icon: Building },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/classifieds', label: 'Classifieds', icon: ShoppingBag },
  ]

  const communityLinks = [
    { href: 'https://www.wetaskiwin.ca/', label: 'City of Wetaskiwin' },
    { href: 'https://www.connectwetaskiwin.com/', label: 'Connect Wetaskiwin' },
    { href: 'https://www.wetaskiwintimes.com/', label: 'The Wetaskiwin Times' },
    { href: 'https://www.pipestoneflyer.ca/', label: 'Pipestone Flyer' },
    { href: '#', label: 'List of Facebook Groups' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-blue-300">
              All Things Wetaskiwin
            </h3>
            <p className="text-gray-300 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
              Your comprehensive community hub connecting residents with local events, 
              businesses, job opportunities, and community news in Wetaskiwin, Alberta.
            </p>
            <div className="flex space-x-4">
              <motion.a
                href="https://www.facebook.com/profile.php?id=61578336054811"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-400 hover:text-blue-300 transition-colors"
                aria-label="Facebook"
              >
                {/* Facebook SVG from simpleicons.org */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="sm:w-6 sm:h-6"
                  aria-hidden="true"
                >
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 10.995 10.125 11.854v-8.385H7.078v-3.47h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.953.926-1.953 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.068 24 18.092 24 12.073z"/>
                </svg>
              </motion.a>
              {/*
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-400 hover:text-blue-300 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} className="sm:w-6 sm:h-6" />
              </motion.a>
              
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-400 hover:text-blue-300 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} className="sm:w-6 sm:h-6" />
              </motion.a>
              */}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Quick Links</h4>
            <ul className="space-y-1 sm:space-y-1.5">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link 
                    href={href}
                    className="text-gray-300 hover:text-blue-300 transition-colors text-sm sm:text-base"
                  >
                    {Icon && <Icon size={14} className="sm:w-4 sm:h-4 inline mr-2" />}
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Community Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Community</h4>
            <ul className="space-y-1 sm:space-y-1.5">
              {communityLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link 
                    href={href}
                    className="text-gray-300 hover:text-blue-300 transition-colors text-sm sm:text-base"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Contact Us</h4>
            <ul className="space-y-1 sm:space-y-1.5">
              <li className="text-gray-300 text-sm sm:text-base">
                <MapPin size={14} className="sm:w-4 sm:h-4 text-blue-300 inline mr-2" />
                <span>Wetaskiwin, Alberta, Canada</span>
              </li>
              <li className="text-gray-300 text-sm sm:text-base">
                <Mail size={14} className="sm:w-4 sm:h-4 text-blue-300 inline mr-2" />
                <a href="mailto:allthingswetaskiwin@gmail.com?subject=General Inquiry" className="hover:text-blue-300 transition-colors">allthingswetaskiwin@gmail.com</a>
              </li>
              <li>
                <Mail size={14} className="sm:w-4 sm:h-4 text-blue-300 inline mr-2" />
                <a href='mailto:wilfordderek@gmail.com?subject=All Things Wetaskiwin - Support' className="hover:text-blue-300 transition-colors">Contact Support</a> 
                </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-0 text-center sm:text-left"
            >
              © {currentYear} All Things Wetaskiwin. All rights reserved.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-center sm:justify-end gap-4 sm:gap-6 text-xs sm:text-sm"
            >
              <Link href="/privacy-policy" className="text-gray-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-blue-300 transition-colors">
                Terms of Service
              </Link>
              <Link href="/accessibility" className="text-gray-400 hover:text-blue-300 transition-colors">
                Accessibility
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
