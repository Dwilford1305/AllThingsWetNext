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
  duration = 0.6,
  stagger = 0
}: AnimatedSectionProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { 
    once: true, 
    margin: "0px 0px -25px 0px", // Even smaller margin for instant triggering
    amount: 0.1 // Lower threshold to avoid scroll blocking
  })

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...(direction === 'up' && { y: 10 }), // Even smaller movement to avoid scroll interference
      ...(direction === 'down' && { y: -10 }),
      ...(direction === 'left' && { x: -10 }),
      ...(direction === 'right' && { x: 10 }),
      ...(direction === 'scale' && { scale: 0.99 }),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: duration * 0.5, // Much faster animations to prevent scroll blocking
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Smooth easing
        ...(stagger > 0 && { staggerChildren: stagger * 0.5 }), // Reduce stagger even more
      }
    }
  }

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 5, // Minimal movement
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2, // Ultra-fast child animations
        ease: [0.25, 0.1, 0.25, 1]
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
