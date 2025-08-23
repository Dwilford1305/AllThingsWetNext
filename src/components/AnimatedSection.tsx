'use client'

import { motion, useInView } from 'framer-motion'
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
    margin: "0px 0px -150px 0px",
    amount: 0.1 
  })

  const variants = {
    hidden: {
      opacity: 0,
      ...(direction === 'up' && { y: 60 }),
      ...(direction === 'down' && { y: -60 }),
      ...(direction === 'left' && { x: -60 }),
      ...(direction === 'right' && { x: 60 }),
      ...(direction === 'scale' && { scale: 0.8 }),
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1],
        when: "beforeChildren",
        staggerChildren: stagger,
      }
    }
  }

  const childVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
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
