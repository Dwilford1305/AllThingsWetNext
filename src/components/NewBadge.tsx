import { isNewItem, isNewEvent } from '@/lib/utils'

interface NewBadgeProps {
  date?: Date | string
  addedAt?: Date | string
  className?: string
}

export function NewBadge({ date, addedAt, className = '' }: NewBadgeProps) {
  let isNew = false
  
  // For events, use addedAt (when first added to system)
  if (addedAt) {
    isNew = isNewEvent(addedAt)
  }
  // For news, use date (published today)
  else if (date) {
    isNew = isNewItem(date)
  }
  
  if (!isNew) {
    return null
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 ${className}`}>
      NEW
    </span>
  )
}

export default NewBadge
