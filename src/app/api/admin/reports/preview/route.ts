import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceListing, MarketplaceComment } from '@/models'
import { withRole, type AuthenticatedRequest } from '@/lib/auth-middleware'

async function getPreview(
  request: AuthenticatedRequest
) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'listing' | 'comment'
    const id = searchParams.get('id')
    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Missing type or id' }, { status: 400 })
    }

    if (type === 'listing') {
      const listing = await MarketplaceListing
        .findOne({ id })
        .lean<{
          id: string
          title?: string
          description?: string
          images?: string[]
          status?: string
          moderation?: { state: 'hidden' | 'awaiting_review' | 'none'; reason?: string }
        }>()
      if (!listing) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 })
      const preview = {
        id: listing.id,
        title: listing.title,
        description: listing.description?.slice(0, 200) || '',
        image: Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : undefined,
        status: listing.status,
        moderation: listing.moderation || undefined
      }
      return NextResponse.json({ success: true, data: preview })
    }

    if (type === 'comment') {
      const comment = await MarketplaceComment
        .findOne({ id })
        .lean<{
          id: string
          content?: string
          userId: string
          userName: string
          isHidden: boolean
          moderation?: { state: 'hidden' | 'awaiting_review' | 'none'; reason?: string }
        }>()
      if (!comment) return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 })
      const preview = {
        id: comment.id,
        content: comment.content?.slice(0, 200) || '',
        userId: comment.userId,
        userName: comment.userName,
        isHidden: comment.isHidden,
        moderation: comment.moderation || undefined
      }
      return NextResponse.json({ success: true, data: preview })
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Preview fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch preview' }, { status: 500 })
  }
}

export const GET = withRole(['admin', 'super_admin'], getPreview)
