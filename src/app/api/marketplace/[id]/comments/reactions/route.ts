import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { MarketplaceComment } from '@/models'
import { withAuth, type AuthenticatedRequest } from '@/lib/auth-middleware'

type Reaction = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

async function toggleCommentReaction(
  request: AuthenticatedRequest,
  context?: Record<string, unknown>
) {
  try {
    await connectDB()
    type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
    const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
    let commentId: string | undefined
    if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
      const awaited = await (rawParams as Promise<{ id: string }>)
      commentId = awaited.id
    } else {
      commentId = (rawParams as { id?: string } | undefined)?.id
    }
    if (!commentId) return NextResponse.json({ success: false, error: 'Comment ID missing' }, { status: 400 })

    const userId = request.user?.id
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { reaction } = await request.json() as { reaction: Reaction }
    if (!reaction) return NextResponse.json({ success: false, error: 'Reaction missing' }, { status: 400 })

    const comment = await MarketplaceComment.findOne({ id: commentId })
    if (!comment) return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 })

    // Initialize reactions container if missing
  if (!comment.reactions) comment.reactions = { like: [], love: [], haha: [], wow: [], sad: [], angry: [] } as unknown as Record<Reaction, string[]>

    // Remove user from all reactions first (toggle exclusive selection)
    for (const key of Object.keys(comment.reactions) as Reaction[]) {
      comment.reactions[key] = (comment.reactions[key] || []).filter((uid: string) => uid !== userId)
    }

    // Add to the selected reaction
    comment.reactions[reaction] = [ ...(comment.reactions[reaction] || []), userId ]
    await comment.save()

    return NextResponse.json({ success: true, data: { reactions: comment.reactions } })
  } catch (e) {
    console.error('Toggle comment reaction error:', e)
    return NextResponse.json({ success: false, error: 'Failed to react' }, { status: 500 })
  }
}

export const POST = withAuth(toggleCommentReaction)
