import { NextRequest } from 'next/server'

// Simple in-memory subscribers per listing for dev; for production, use Pusher/Ably or Redis pub/sub
const subscribers = new Map<string, Set<ReadableStreamDefaultController>>()

export async function GET(
  request: NextRequest,
  context?: Record<string, unknown>
) {
  const encoder = new TextEncoder()

  type ParamsMaybe = { id?: string } | Promise<{ id: string }> | undefined
  const rawParams = (context as { params?: ParamsMaybe } | undefined)?.params
  let listingId: string | undefined
  if (rawParams && typeof (rawParams as { then?: unknown }).then === 'function') {
    const awaited = await (rawParams as Promise<{ id: string }>)
    listingId = awaited.id
  } else {
    listingId = (rawParams as { id?: string } | undefined)?.id
  }
  if (!listingId) {
    return new Response('Listing ID missing', { status: 400 })
  }

  const stream = new ReadableStream({
    start(controller) {
      const set = subscribers.get(listingId!) || new Set()
      set.add(controller)
      subscribers.set(listingId!, set)
      controller.enqueue(encoder.encode(`event: ping\ndata: connected\n\n`))
    },
    cancel() {
      const set = subscribers.get(listingId!)
      if (set) {
        for (const c of set) {
          if (c.desiredSize === null) {
            set.delete(c)
          }
        }
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}

// Utility to notify listeners (imported by comment POST handler via dynamic import to avoid cycles)
export function notifyNewComment(listingId: string, payload: unknown) {
  const set = subscribers.get(listingId)
  if (!set) return
  const data = `data: ${JSON.stringify(payload)}\n\n`
  const chunk = new TextEncoder().encode(data)
  for (const controller of set) {
    try {
      controller.enqueue(chunk)
    } catch {}
  }
}
