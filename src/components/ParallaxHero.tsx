'use client'

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'

const ParallaxHero = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.2])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.05])
  
  // Mouse parallax effect
  const springConfig = { stiffness: 100, damping: 30 }
  const mouseX = useSpring(mousePosition.x, springConfig)
  const mouseY = useSpring(mousePosition.y, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth <= 768) return;
      
      const { clientX, clientY } = e
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      setMousePosition({
        x: (clientX - centerX) / centerX * 0.1, // Reduced for subtlety
        y: (clientY - centerY) / centerY * 0.1
      })
    }

    if (window.innerWidth > 768) {
      window.addEventListener('mousemove', handleMouseMove)
    }
    
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div ref={ref} className="hero-parallax">
      {/* Background Image */}
      <motion.div
        style={{ 
          y, 
          opacity: useTransform(opacity, [1, 0.2], [0.8, 0.3]),
          scale,
          backgroundImage: "url('/WaterTower.png')",
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
        }}
        className="hero-background"
      />
      
      {/* Content Overlay */}
      <div className="hero-overlay">
        <div className="site-container hero-content">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="hero-text-section"
          >
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              All Things Wetaskiwin
            </motion.h1>
            
            <motion.p 
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Your community hub connecting Wetaskiwin through local events, businesses, and opportunities
            </motion.p>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="hero-actions"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/events" className="button button-primary">
                <span>Explore Events</span>
                <motion.span
                  animate={{ x: [0, 2, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/businesses" className="button button-secondary">
                <span>Browse Businesses</span>
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  ✦
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Scroll Indicator */}
          <motion.div 
            className="hero-scroll-indicator"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            <div className="scroll-mouse">
              <motion.div 
                className="scroll-wheel"
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Subtle floating elements */}
      <motion.div
        style={{
          x: useTransform(mouseX, [-1, 1], [-5, 5]),
          y: useTransform(mouseY, [-1, 1], [-5, 5])
        }}
        className="hero-float-element hero-float-1"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        style={{
          x: useTransform(mouseX, [-1, 1], [8, -8]),
          y: useTransform(mouseY, [-1, 1], [8, -8])
        }}
        className="hero-float-element hero-float-2"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

export default ParallaxHero
