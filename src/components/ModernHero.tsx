'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const ModernHero = () => {
  return (
    <section className="hero-modern">
      <div className="hero-container-modern">
        {/* Background Pattern */}
        <div className="hero-background-pattern">
          <div className="pattern-grid">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="pattern-dot" style={{ 
                animationDelay: `${i * 0.1}s` 
              }}></div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <motion.div 
          className="hero-content-modern"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Location Badge */}
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            📍 Wetaskiwin, Alberta
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            className="hero-title-modern"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Your Community
            <span className="hero-accent">Connected</span>
          </motion.h1>
          
          {/* Description */}
          <motion.p 
            className="hero-description-modern"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Discover local events, support businesses, find opportunities, and connect 
            with your neighbors in Wetaskiwin&apos;s digital community hub.
          </motion.p>

          {/* Action Buttons */}
          <motion.div 
            className="hero-actions-modern"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Link href="/events" className="hero-button-primary">
              Explore Events
            </Link>
            <Link href="/businesses" className="hero-button-secondary">
              Find Businesses
            </Link>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <div className="stat-item">
              <span className="stat-number">1,250+</span>
              <span className="stat-label">Community Members</span>
            </div>
            <div className="stat-separator">•</div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Local Businesses</span>
            </div>
            <div className="stat-separator">•</div>
            <div className="stat-item">
              <span className="stat-number">Weekly</span>
              <span className="stat-label">Events & Updates</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Side Image */}
        <motion.div 
          className="hero-image-modern"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <div className="hero-image-frame">
            <img 
              src="https://allthingswetaskiwin.s3.us-east-1.amazonaws.com/images/original+copy+5.jpeg"
              alt="Wetaskiwin Water Tower"
              className="hero-image-photo"
            />
            <div className="hero-image-overlay">
              <div className="image-badge">
                🏛️ Historic Wetaskiwin
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default ModernHero