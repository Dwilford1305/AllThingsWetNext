'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'

const ParallaxHero = () => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.3])

  return (
    <div ref={ref} className="relative h-screen overflow-hidden max-h-screen" data-scroll-container="true">
      {/* Parallax Background */}
      <motion.div
        style={{ 
          y, 
          opacity,
          backgroundImage: "url('/WaterTower.png')",
          backgroundPosition: 'center 30%', // Move image up for desktop
          backgroundSize: 'cover',
        }}
        className="absolute inset-0 w-full h-[120%] bg-cover bg-center bg-no-repeat
          sm:bg-center sm:h-[120%]
          md:bg-[length:100%_100%] md:bg-center md:h-full
          lg:bg-[length:80%_100%] lg:bg-center lg:h-full"
      />
      
      {/* Gradient Overlay - Lighter to showcase water tower */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      
      {/* Text Shadow Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Content - Split Layout */}
      <div className="relative z-10 flex flex-col h-full text-white px-3 sm:px-4 overflow-hidden max-h-screen">
        {/* Top Section - Minimal Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex-1 flex items-center justify-center pt-24 sm:pt-20 md:pt-16 overflow-hidden max-h-screen"
        >
          <motion.h1 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight drop-shadow-lg px-4"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            All Things
            <motion.span 
              className="block text-blue-300 drop-shadow-lg"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              Wetaskiwin
            </motion.span>
          </motion.h1>
        </motion.div>

        {/* Bottom Section - Description and Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex-1 flex flex-col items-center justify-end pb-20 sm:pb-24 text-center px-4 overflow-hidden max-h-screen"
        >
          <motion.p 
            className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-gray-200 max-w-2xl mx-auto drop-shadow-lg leading-relaxed"
            style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            Your community hub for events, news, businesses, jobs, and more
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link 
                href="/events"
                className="group inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-700 transition-all duration-300 text-center"
              >
                Explore Events
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Link 
                href="/businesses"
                className="group inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-700 transition-all duration-300 text-center"
              >
                Browse Businesses
              </Link>
            </motion.div>
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
