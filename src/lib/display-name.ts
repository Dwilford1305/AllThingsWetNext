export function getDisplayName(user: { username?: string | null; firstName?: string | null; lastName?: string | null }): string {
  if (user?.username && user.username.trim()) return user.username.trim()
  if (user?.firstName && user.firstName.trim()) return user.firstName.trim()
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'User'
}
