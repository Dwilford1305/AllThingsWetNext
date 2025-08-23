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
    margin: "0px 0px -50px 0px", // Smaller margin for smoother triggering
    amount: 0.15 // Lower threshold to trigger animations earlier and avoid scroll conflicts
  })

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...(direction === 'up' && { y: 20 }), // Further reduced movement to minimize scroll interference
      ...(direction === 'down' && { y: -20 }),
      ...(direction === 'left' && { x: -20 }),
      ...(direction === 'right' && { x: 20 }),
      ...(direction === 'scale' && { scale: 0.98 }),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: duration * 0.7, // Even faster transitions to avoid scroll blocking
        delay,
        ease: [0.25, 0.15, 0.25, 1], // Optimized easing for smooth performance
        ...(stagger > 0 && { staggerChildren: stagger * 0.8 }), // Reduce stagger delay
      }
    }
  }

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 10, // Minimal movement to avoid scroll interference
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3, // Very fast child animations
        ease: [0.25, 0.15, 0.25, 1]
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
