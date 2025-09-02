import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 border border-gray-200',
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    secondary: 'bg-purple-100 text-purple-800 border border-purple-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    destructive: 'bg-red-100 text-red-800 border border-red-200',
    outline: 'border-2 border-gray-400 text-gray-700 bg-white hover:bg-gray-50'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200 hover:scale-105',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
