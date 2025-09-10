import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/70 disabled:pointer-events-none disabled:opacity-50 active:scale-95 mobile:min-h-touch-target mobile:min-w-touch-target touch:select-none'
    
    const variants = {
      default: 'bg-gray-900 text-white hover:bg-gray-800',
      primary: 'bg-blue-700 text-white hover:bg-blue-800',
      secondary: 'bg-amber-600 text-black hover:bg-amber-700',
      outline: 'border border-gray-500 bg-white text-gray-900 hover:bg-gray-100',
      ghost: 'text-gray-900 hover:bg-gray-100'
    }
    
    const sizes = {
      sm: 'h-10 px-4 text-sm mobile:h-12 mobile:px-5', // Increased for mobile
      md: 'h-12 px-6 text-sm mobile:h-14 mobile:px-7', // Increased for mobile
      lg: 'h-14 px-8 text-base mobile:h-16 mobile:px-9' // Increased for mobile
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
