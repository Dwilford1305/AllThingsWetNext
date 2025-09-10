import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';
import PushNotificationService from '../../../../../lib/pushNotificationService';

// Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(request, res);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    const pushService = PushNotificationService.getInstance();
    const userAgent = request.headers.get('user-agent') || undefined;
    
    const success = await pushService.subscribeUser(
      session.user.sub,
      session.user.email,
      subscription,
      userAgent
    );

    if (success) {
      // Send welcome notification
      await pushService.sendToUser(
        session.user.sub,
        PushNotificationService.templates.welcomeNotification()
      );

      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to push notifications'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to subscribe to push notifications' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(request, res);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pushService = PushNotificationService.getInstance();
    const success = await pushService.unsubscribeUser(session.user.sub);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully unsubscribed from push notifications'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to unsubscribe from push notifications' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Push unsubscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get subscription status
export async function GET(request: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(request, res);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pushService = PushNotificationService.getInstance();
    const subscription = await pushService.getUserSubscription(session.user.sub);

    return NextResponse.json({
      success: true,
      isSubscribed: !!subscription,
      publicKey: pushService.getPublicKey()
    });
  } catch (error) {
    console.error('Push subscription status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}