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
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  
  // Mouse parallax effect
  const springConfig = { stiffness: 100, damping: 30 }
  const mouseX = useSpring(mousePosition.x, springConfig)
  const mouseY = useSpring(mousePosition.y, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      setMousePosition({
        x: (clientX - centerX) / centerX,
        y: (clientY - centerY) / centerY
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div ref={ref} className="relative h-screen overflow-hidden" style={{ willChange: 'transform' }}>
      {/* Water Tower Background - Balanced visibility and readability */}
      <motion.div
        style={{ 
          y, 
          opacity: useTransform(opacity, [1, 0.2], [0.3, 0.08]), // Increased visibility while maintaining readability
          scale,
          backgroundImage: "url('/WaterTower.png')",
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
        }}
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
      />
      
      {/* Vignette overlay - darker edges, lighter center for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-tl from-black/50 via-transparent to-black/30" />
      
      {/* Radial overlay to keep center lighter for text */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,black/30_70%)]" />
      
      {/* Subtle Floating Elements */}
      <motion.div
        style={{
          x: useTransform(mouseX, [-1, 1], [-10, 10]),
          y: useTransform(mouseY, [-1, 1], [-10, 10])
        }}
        className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/5 rounded-full blur-xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        style={{
          x: useTransform(mouseX, [-1, 1], [15, -15]),
          y: useTransform(mouseY, [-1, 1], [15, -15])
        }}
        className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Content - Professional Layout */}
      <div className="relative z-10 flex flex-col h-full text-white px-4 sm:px-6 lg:px-8">
        {/* Top Section - Clean Professional Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex-1 flex items-center justify-center pt-24 sm:pt-20 md:pt-16"
        >
          <div className="text-center max-w-4xl relative">
            {/* Backdrop blur container for better text readability */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-3xl -m-8" />
            
            <motion.h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6 relative z-10"
              style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 0, 0, 0.5)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="block text-white mb-2">
                All Things
              </span>
              <motion.span 
                className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                style={{ textShadow: '2px 2px 8px rgba(59, 130, 246, 0.3), 0 0 20px rgba(147, 51, 234, 0.3)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              >
                Wetaskiwin
              </motion.span>
            </motion.h1>
            
            {/* Clean Professional Subtitle */}
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-gray-100 leading-relaxed max-w-3xl mx-auto relative z-10"
              style={{ textShadow: '1px 1px 4px rgba(0, 0, 0, 0.8), 0 0 12px rgba(0, 0, 0, 0.6)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Your modern community hub connecting 
              <span className="text-blue-300 font-semibold"> Wetaskiwin </span>
              through innovation
            </motion.p>
          </div>
        </motion.div>

        {/* Bottom Section - Professional CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex-1 flex flex-col items-center justify-end pb-16 sm:pb-20 text-center px-4"
        >
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 w-full max-w-2xl relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            {/* Backdrop for buttons */}
            <div className="absolute inset-0 bg-black/15 backdrop-blur-sm rounded-2xl -m-4" />
            
            <motion.div
              whileHover={{ 
                scale: 1.05,
                y: -3
              }}
              whileTap={{ scale: 0.98 }}
              className="relative z-10"
            >
              <Link 
                href="/events"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white/15 backdrop-blur-md border border-white/40 rounded-xl font-semibold text-lg text-white hover:bg-white/25 hover:border-white/50 transition-all duration-300"
                style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)' }}
              >
                <span>Explore Events</span>
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  →
                </motion.div>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ 
                scale: 1.05,
                y: -3
              }}
              whileTap={{ scale: 0.98 }}
              className="relative z-10"
            >
              <Link 
                href="/businesses"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)' }}
              >
                <span>Browse Businesses</span>
                <motion.div
                  animate={{ rotate: [0, 90, 180, 270, 360] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  ✦
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Clean Scroll Indicator */}
          <motion.div 
            className="mt-16 sm:mt-20"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
              <motion.div 
                className="w-1 h-3 bg-white/60 rounded-full mt-2"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default ParallaxHero
