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
    margin: "0px 0px -100px 0px", // Reduced margin for better performance
    amount: 0.2 // Increased threshold for more consistent triggering
  })

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...(direction === 'up' && { y: 30 }), // Reduced movement for smoother animation
      ...(direction === 'down' && { y: -30 }),
      ...(direction === 'left' && { x: -30 }),
      ...(direction === 'right' && { x: 30 }),
      ...(direction === 'scale' && { scale: 0.95 }),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: duration * 0.8, // Slightly faster transitions
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Smoother easing curve
        ...(stagger > 0 && { staggerChildren: stagger }),
      }
    }
  }

  const childVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 15, // Reduced movement
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4, // Faster child animations
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
