import { NextResponse } from 'next/server';
import PushNotificationService from '@/lib/pushNotificationService';

// Get push notification configuration (VAPID public key)
export async function GET() {
  try {
    const pushService = PushNotificationService.getInstance();
    const publicKey = pushService.getPublicKey();

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      publicKey,
      supportsPush: true
    });
  } catch (error) {
    console.error('Push config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}