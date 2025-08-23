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
    <div ref={ref} className="relative h-screen overflow-hidden max-h-screen" data-scroll-container="true">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-secondary-600/10 to-accent-600/20 animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-tl from-primary-900/30 via-transparent to-secondary-900/20" />
      </div>

      {/* Parallax Background */}
      <motion.div
        style={{ 
          y, 
          opacity,
          scale,
          backgroundImage: "url('/WaterTower.png')",
          backgroundPosition: 'center 30%',
          backgroundSize: 'cover',
        }}
        className="absolute inset-0 w-full h-[120%] bg-cover bg-center bg-no-repeat
          sm:bg-center sm:h-[120%]
          md:bg-[length:100%_100%] md:bg-center md:h-full
          lg:bg-[length:80%_100%] lg:bg-center lg:h-full"
      />
      
      {/* Floating Elements */}
      <motion.div
        style={{
          x: useTransform(mouseX, [-1, 1], [-20, 20]),
          y: useTransform(mouseY, [-1, 1], [-20, 20])
        }}
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-float"
      />
      <motion.div
        style={{
          x: useTransform(mouseX, [-1, 1], [30, -30]),
          y: useTransform(mouseY, [-1, 1], [30, -30])
        }}
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl animate-float"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20" />
      
      {/* Content - Modern Layout */}
      <div className="relative z-10 flex flex-col h-full text-white px-4 sm:px-6 lg:px-8 overflow-hidden max-h-screen">
        {/* Top Section - Modern Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 flex items-center justify-center pt-24 sm:pt-20 md:pt-16 overflow-hidden max-h-screen"
        >
          <div className="text-center max-w-4xl">
            <motion.h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent drop-shadow-2xl shadow-2xl"
                    style={{ 
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)', 
                      WebkitTextStroke: '1px rgba(0,0,0,0.3)' 
                    }}>
                All Things
              </span>
              <motion.span 
                className="block bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent drop-shadow-2xl shadow-2xl"
                style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)', 
                  WebkitTextStroke: '1px rgba(0,0,0,0.3)' 
                }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                Wetaskiwin
              </motion.span>
            </motion.h1>
            
            {/* Subtitle with modern styling */}
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              Your modern community hub connecting 
              <span className="text-blue-300 font-semibold"> Wetaskiwin </span>
              through innovation
            </motion.p>
          </div>
        </motion.div>

        {/* Bottom Section - Enhanced CTA */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex-1 flex flex-col items-center justify-end pb-16 sm:pb-20 text-center px-4 overflow-hidden max-h-screen"
        >
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 w-full max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
                y: -5
              }}
              whileTap={{ scale: 0.95 }}
              className="group"
            >
              <Link 
                href="/events"
                className="btn-glass glass backdrop-blur-md px-8 py-4 rounded-xl font-bold text-lg text-white border border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-500 group-hover:shadow-glass inline-flex items-center gap-3"
              >
                <span>Explore Events</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  →
                </motion.div>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)",
                y: -5
              }}
              whileTap={{ scale: 0.95 }}
              className="group"
            >
              <Link 
                href="/businesses"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-500 shadow-lg hover:shadow-xl inline-flex items-center gap-3"
              >
                <span>Browse Businesses</span>
                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  ✦
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Scroll Indicator */}
          <motion.div 
            className="mt-16 sm:mt-20"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <motion.div 
                className="w-1 h-3 bg-white rounded-full mt-2"
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-2 sm:h-3 bg-white rounded-full mt-1.5 sm:mt-2 animate-pulse"></div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ParallaxHero
