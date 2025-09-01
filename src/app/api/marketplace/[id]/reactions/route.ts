import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'

type Reaction = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

async function toggleListingReaction(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
    const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
    let listingId: string | undefined
    if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
      const awaited = await (rawParams as Promise<{ id: string }>)
      listingId = awaited.id
    } else {
      listingId = (rawParams as { id?: string } | undefined)?.id
    }
    if (!listingId) return NextResponse.json({ success: false, error: 'Listing ID missing' }, { status: 400 })

    const userId = request.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { reaction } = await request.json() as { reaction: Reaction }
    if (!reaction) return NextResponse.json({ success: false, error: 'Reaction missing' }, { status: 400 })

    const listing = await MarketplaceListing.findOne({ id: listingId })
    if (!listing) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 })

    if (!listing.reactions) listing.reactions = { like: [], love: [], haha: [], wow: [], sad: [], angry: [] } as unknown as Record<Reaction, string[]>
    for (const key of Object.keys(listing.reactions) as Reaction[]) {
      listing.reactions[key] = (listing.reactions[key] || []).filter((uid: string) => uid !== userId)
    }
    listing.reactions[reaction] = [ ...(listing.reactions[reaction] || []), userId ]
    await listing.save()

    return NextResponse.json({ success: true, data: { reactions: listing.reactions } })
  } catch (e) {
    console.error('Toggle listing reaction error:', e)
    return NextResponse.json({ success: false, error: 'Failed to react' }, { status: 500 })
  }
}

export const POST = withAuth(toggleListingReaction)
