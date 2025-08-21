import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Business } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'
import type { User as UserType } from '@/types/auth'

async function getUserBusinesses(request: AuthenticatedRequest) {
  try {
    await connectDB()

  const u = (request.user || {}) as Partial<UserType>
  const email = u.email
  const userId = u.id
  const businessIds = u.businessIds || []

    if (!email && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find businesses claimed by this user
  const query: Record<string, unknown> = {
      $or: [
        // Claimed via email
    ...(email ? [{ claimedBy: email, isClaimed: true } as Record<string, unknown>] : []),
        // Claimed via userId linkage
    ...(userId ? [{ claimedByUserId: userId } as Record<string, unknown>] : []),
        // Explicit business ownership list on user
    ...(businessIds.length ? [{ id: { $in: businessIds } } as Record<string, unknown>] : []),
      ]
  }

    const claimedBusinesses = await Business.find(query)
      .sort({ claimedAt: -1 })
      .lean()

    return NextResponse.json({ success: true, businesses: claimedBusinesses })
  } catch (error) {
    console.error('Error fetching user businesses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withAuth(getUserBusinesses)
