import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function formatCurrency(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\(\)\+\.]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
}

export function isNewItem(date: Date | string): boolean {
  const itemDate = new Date(date)
  const now = new Date()
  
  // Check if the item was added within the last 24 hours
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  return itemDate > twentyFourHoursAgo
}

export function isNewEvent(addedAt: Date | string): boolean {
  const addedDate = new Date(addedAt)
  const now = new Date()
  
  // Check if the event was added within the last 24 hours
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  return addedDate > twentyFourHoursAgo
}

export function formatDateRelative(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffTime = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return formatDate(d)
  }
}
