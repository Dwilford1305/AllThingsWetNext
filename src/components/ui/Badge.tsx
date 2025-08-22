import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300',
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',
    secondary: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md',
    success: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md',
    warning: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md',
    destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',
    outline: 'border-2 border-gray-300 text-gray-700 bg-white/90 backdrop-blur-sm hover:bg-gray-50 transition-colors'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 hover:scale-105',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
