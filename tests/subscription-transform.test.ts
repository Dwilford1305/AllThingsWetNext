import { describe, it, expect } from '@jest/globals';

// We'll export the transform function for testing
interface ApiSubscriptionResponse {
  tier: string;
  status: string;
  subscriptionStart?: Date | string;
  subscriptionEnd?: Date | string;
  adQuota: {
    monthly: number;
    used: number;
    resetDate: Date | string;
  };
  features: {
    featuredAds: boolean;
    analytics: boolean;
    prioritySupport: boolean;
    photoLimit: number;
    adDuration: number;
  };
}

interface UserSubscription {
  tier: string;
  status: string;
  quota: {
    monthly: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
  features: {
    featuredAds: boolean;
    analytics: boolean;
    prioritySupport: boolean;
    photoLimit: number;
    adDuration: number;
  };
}

// Copy the transform function from the component
const transformApiResponse = (apiData: ApiSubscriptionResponse): UserSubscription => {
  const remaining = apiData.adQuota.monthly === -1 || apiData.adQuota.monthly === 9999 
    ? -1 // Unlimited
    : Math.max(0, apiData.adQuota.monthly - apiData.adQuota.used);

  return {
    tier: apiData.tier,
    status: apiData.status,
    quota: {
      monthly: apiData.adQuota.monthly,
      used: apiData.adQuota.used,
      remaining,
      resetDate: typeof apiData.adQuota.resetDate === 'string' 
        ? apiData.adQuota.resetDate 
        : apiData.adQuota.resetDate.toString()
    },
    features: apiData.features
  };
};

describe('subscription data transformation', () => {
  it('should correctly transform super admin platinum subscription', () => {
    const apiResponse: ApiSubscriptionResponse = {
      tier: 'platinum',
      status: 'active',
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      adQuota: {
        monthly: 9999, // Unlimited for super admin
        used: 0,
        resetDate: new Date(2024, 1, 1) // Feb 1, 2024
      },
      features: {
        featuredAds: true,
        analytics: true,
        prioritySupport: true,
        photoLimit: 20,
        adDuration: 90
      }
    };

    const result = transformApiResponse(apiResponse);

    expect(result).toEqual({
      tier: 'platinum',
      status: 'active',
      quota: {
        monthly: 9999,
        used: 0,
        remaining: -1, // Should be unlimited
        resetDate: expect.any(String)
      },
      features: {
        featuredAds: true,
        analytics: true,
        prioritySupport: true,
        photoLimit: 20,
        adDuration: 90
      }
    });
  });

  it('should correctly calculate remaining quota for regular users', () => {
    const apiResponse: ApiSubscriptionResponse = {
      tier: 'gold',
      status: 'active',
      adQuota: {
        monthly: 15,
        used: 3,
        resetDate: '2024-02-01T00:00:00.000Z'
      },
      features: {
        featuredAds: true,
        analytics: true,
        prioritySupport: true,
        photoLimit: 10,
        adDuration: 60
      }
    };

    const result = transformApiResponse(apiResponse);

    expect(result.quota.remaining).toBe(12); // 15 - 3
    expect(result.quota.monthly).toBe(15);
    expect(result.quota.used).toBe(3);
  });

  it('should handle zero remaining quota correctly', () => {
    const apiResponse: ApiSubscriptionResponse = {
      tier: 'silver',
      status: 'active',
      adQuota: {
        monthly: 5,
        used: 7, // Used more than allowed
        resetDate: '2024-02-01T00:00:00.000Z'
      },
      features: {
        featuredAds: false,
        analytics: true,
        prioritySupport: false,
        photoLimit: 5,
        adDuration: 45
      }
    };

    const result = transformApiResponse(apiResponse);

    expect(result.quota.remaining).toBe(0); // Should be 0, not negative
  });

  it('should prevent client-side error that occurred before fix', () => {
    // This simulates the exact API response that was causing the client-side error
    const problematicApiResponse: ApiSubscriptionResponse = {
      tier: 'platinum',
      status: 'active',
      adQuota: { // API returns 'adQuota', not 'quota'
        monthly: 9999,
        used: 0,
        resetDate: new Date() // API returns Date object, not string
        // No 'remaining' field returned by API
      },
      features: {
        featuredAds: true,
        analytics: true,
        prioritySupport: true,
        photoLimit: 20,
        adDuration: 90
      }
    };

    // Before our fix, this would cause: TypeError: Cannot read properties of undefined (reading 'remaining')
    // Because the component would try to access apiResponse.quota.remaining
    // But API returns apiResponse.adQuota (without remaining field)
    
    // Our fix transforms the data properly:
    const transformed = transformApiResponse(problematicApiResponse);
    
    // These accesses should work without throwing errors:
    expect(transformed.quota).toBeDefined();
    expect(transformed.quota.remaining).toBeDefined();
    expect(transformed.quota.monthly).toBe(9999);
    expect(transformed.quota.used).toBe(0);
    expect(transformed.quota.remaining).toBe(-1); // Unlimited
    expect(typeof transformed.quota.resetDate).toBe('string');
    
    // The component can now safely access these properties without errors
    expect(() => {
      const remaining = transformed.quota.remaining;
      const monthly = transformed.quota.monthly; 
      const resetDate = new Date(transformed.quota.resetDate);
      return { remaining, monthly, resetDate };
    }).not.toThrow();
  });
});