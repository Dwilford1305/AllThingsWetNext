/**
 * Utility functions for generating consistent IDs for scraped content
 */

/**
 * Generate a unique ID for an event based on title and date
 */
export function generateEventId(title: string, date: Date): string {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  const dateStr = date.toISOString().split('T')[0]
  return `${cleanTitle}-${dateStr}`
}

/**
 * Generate a unique ID for a news article based on title and published date
 */
export function generateArticleId(title: string, publishedAt: Date): string {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  const dateStr = publishedAt.toISOString().split('T')[0]
  return `${cleanTitle}-${dateStr}`
}

/**
 * Generate a unique ID for a business based on name and address
 */
export function generateBusinessId(name: string, address: string): string {
  // Normalize business name - remove common suffixes that don't change the business identity
  const normalizedName = name.toLowerCase()
    .replace(/\b(ltd|inc|corp|co|llc|limited|incorporated|corporation|company)\b\.?/g, '') // Remove business suffixes
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
  
  // Create clean name for ID
  const cleanName = normalizedName
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 50) // Limit name length
  
  // Extract just the street number for address uniqueness
  const streetNumber = address.match(/^#?\d+[a-z]?/i)?.[0] || ''
  const cleanStreetNumber = streetNumber.toLowerCase().replace(/[^0-9a-z]/g, '')
  
  // For businesses with the same name, differentiate by street number only
  if (cleanStreetNumber) {
    return `${cleanName}-${cleanStreetNumber}`
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 80)
  } else {
    return cleanName
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80)
  }
}
