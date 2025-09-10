'use client'

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn, mobileUtils } from '@/lib/utils'

// Input component optimized for mobile
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const MobileInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mobile:text-base"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            // Base styles
            'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            // Mobile optimizations
            mobileUtils.mobileInput,
            'mobile:rounded-xl mobile:border-2 mobile:focus-visible:ring-4 mobile:focus-visible:ring-blue-500/25',
            // Touch interactions
            'touch-manipulation focus:border-blue-500 transition-all duration-200',
            // Error state
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-gray-500 mobile:text-sm">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-600 mobile:text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

MobileInput.displayName = 'MobileInput'

// Textarea component optimized for mobile
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mobile:text-base"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            // Base styles
            'flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            // Mobile optimizations
            'mobile:min-h-[120px] mobile:text-base mobile:px-4 mobile:py-3 mobile:rounded-xl mobile:border-2 mobile:focus-visible:ring-4 mobile:focus-visible:ring-blue-500/25',
            // Touch interactions
            'touch-manipulation focus:border-blue-500 transition-all duration-200 resize-y',
            // Error state
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-gray-500 mobile:text-sm">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-600 mobile:text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

MobileTextarea.displayName = 'MobileTextarea'

// Select component optimized for mobile
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
}

export const MobileSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, ...props }, ref) => {
    const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mobile:text-base"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            // Base styles
            'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            // Mobile optimizations
            mobileUtils.mobileInput,
            'mobile:rounded-xl mobile:border-2 mobile:focus-visible:ring-4 mobile:focus-visible:ring-blue-500/25',
            // Touch interactions
            'touch-manipulation focus:border-blue-500 transition-all duration-200',
            // Error state
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p className="text-xs text-gray-500 mobile:text-sm">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-600 mobile:text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

MobileSelect.displayName = 'MobileSelect'

// Form wrapper with mobile optimizations
interface MobileFormProps {
  children: React.ReactNode
  className?: string
  onSubmit?: (e: React.FormEvent) => void
}

export function MobileForm({ children, className, onSubmit }: MobileFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'space-y-4 mobile:space-y-6',
        className
      )}
    >
      {children}
    </form>
  )
}

// Search input optimized for mobile
interface MobileSearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  showClearButton?: boolean
}

export const MobileSearchInput = forwardRef<HTMLInputElement, MobileSearchInputProps>(
  ({ className, onClear, showClearButton = true, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        <input
          type="search"
          className={cn(
            // Base styles
            'flex w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            // Mobile optimizations
            mobileUtils.mobileInput,
            'mobile:rounded-xl mobile:border-2 mobile:pl-12 mobile:pr-12 mobile:focus-visible:ring-4 mobile:focus-visible:ring-blue-500/25',
            // Touch interactions
            'touch-manipulation focus:border-blue-500 transition-all duration-200',
            // Clear button space
            showClearButton && props.value && 'pr-10 mobile:pr-12',
            className
          )}
          ref={ref}
          {...props}
        />
        {showClearButton && props.value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 touch-manipulation min-w-[44px] min-h-[44px] mobile:min-w-[48px] mobile:min-h-[48px]"
            aria-label="Clear search"
          >
            <svg 
              className="w-5 h-5 text-gray-400 hover:text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

MobileSearchInput.displayName = 'MobileSearchInput'