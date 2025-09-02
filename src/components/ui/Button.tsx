import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 active:scale-95'
    
    const variants = {
      default: 'bg-neutral-800 text-white hover:bg-neutral-700 shadow-lg hover:shadow-xl',
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl',
      secondary: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl',
      outline: 'border-2 border-neutral-600 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-700 shadow-md hover:shadow-lg',
      ghost: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
      success: 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl',
      warning: 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl',
      error: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
    }
    
    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-13 px-8 text-lg',
      xl: 'h-15 px-10 text-xl'
    }

    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
