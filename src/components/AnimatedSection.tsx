'use client'

import { motion, useInView, Variants } from 'framer-motion'
import { useRef } from 'react'

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale'
  duration?: number
  stagger?: number
}

const AnimatedSection = ({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up',
  duration = 0.3, // Faster default animation
  stagger = 0
}: AnimatedSectionProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { 
    once: true, 
    margin: "0px 0px 0px 0px", // Remove margins that could interfere with mobile scroll
    amount: 0.01 // Ultra-low threshold to prevent scroll interference on mobile
  })

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...(direction === 'up' && { y: 5 }), // Minimal movement to avoid scroll interference
      ...(direction === 'down' && { y: -5 }),
      ...(direction === 'left' && { x: -5 }),
      ...(direction === 'right' && { x: 5 }),
      ...(direction === 'scale' && { scale: 0.98 }),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: duration * 0.3, // Ultra-fast animations to prevent any scroll blocking
        delay,
        ease: [0.20, 0, 0.13, 1], // Very smooth easing
        ...(stagger > 0 && { staggerChildren: stagger * 0.3 }), // Minimal stagger
      }
    }
  }

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 2, // Almost no movement
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.1, // Extremely fast child animations
        ease: [0.20, 0, 0.13, 1]
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {stagger > 0 ? (
        <motion.div variants={childVariants}>
          {children}
        </motion.div>
      ) : children}
    </motion.div>
  )
}

export default AnimatedSection
