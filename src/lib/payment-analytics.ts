/**
 * Payment Analytics Service
 * Provides payment insights, reporting, and analytics for the admin dashboard
 */

export interface PaymentMetrics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  currency: string;
  period: {
    start: Date;
    end: Date;
  };
}

export interface SubscriptionMetrics {
  activeSubscriptions: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  churnRate: number;
  averageLifetimeValue: number;
  tierBreakdown: {
    [tier: string]: {
      count: number;
      revenue: number;
      percentage: number;
    };
  };
}

export interface PaymentAnalytics {
  revenue: PaymentMetrics;
  subscriptions: SubscriptionMetrics;
  trends: {
    revenueGrowth: number;
    subscriptionGrowth: number;
    conversionRate: number;
  };
  topPerformers: {
    tiers: Array<{
      tier: string;
      revenue: number;
      count: number;
    }>;
    periods: Array<{
      period: string;
      revenue: number;
    }>;
  };
}

export interface PaymentReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period: {
    start: Date;
    end: Date;
  };
  analytics: PaymentAnalytics;
  generatedAt: Date;
  generatedBy?: string;
}

/**
 * Payment Analytics Service
 */
export class PaymentAnalyticsService {
  /**
   * Get payment analytics for a specific period
   */
  static async getAnalytics(
    startDate: Date,
    endDate: Date,
    currency: string = 'CAD'
  ): Promise<PaymentAnalytics> {
    // In production, this would query actual payment data from the database
    // For now, we'll return mock data with realistic structure
    
    console.log('📊 Generating payment analytics:', {
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      currency
    });

    const mockAnalytics: PaymentAnalytics = {
      revenue: {
        totalRevenue: 12450.75,
        totalTransactions: 67,
        averageTransactionValue: 185.83,
        currency,
        period: { start: startDate, end: endDate }
      },
      subscriptions: {
        activeSubscriptions: 45,
        newSubscriptions: 12,
        cancelledSubscriptions: 3,
        churnRate: 6.7,
        averageLifetimeValue: 523.40,
        tierBreakdown: {
          silver: { count: 20, revenue: 3998.00, percentage: 44.4 },
          gold: { count: 18, revenue: 7194.00, percentage: 40.0 },
          platinum: { count: 7, revenue: 5598.00, percentage: 15.6 }
        }
      },
      trends: {
        revenueGrowth: 23.5,
        subscriptionGrowth: 15.2,
        conversionRate: 12.8
      },
      topPerformers: {
        tiers: [
          { tier: 'gold', revenue: 7194.00, count: 18 },
          { tier: 'platinum', revenue: 5598.00, count: 7 },
          { tier: 'silver', revenue: 3998.00, count: 20 }
        ],
        periods: [
          { period: 'This Week', revenue: 2845.25 },
          { period: 'Last Week', revenue: 3125.50 },
          { period: '2 Weeks Ago', revenue: 2890.75 }
        ]
      }
    };

    return mockAnalytics;
  }

  /**
   * Generate comprehensive payment report
   */
  static async generateReport(
    type: PaymentReport['type'],
    customStart?: Date,
    customEnd?: Date,
    generatedBy?: string
  ): Promise<PaymentReport> {
    const { start, end } = this.getDateRange(type, customStart, customEnd);
    const analytics = await this.getAnalytics(start, end);

    const report: PaymentReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      period: { start, end },
      analytics,
      generatedAt: new Date(),
      generatedBy
    };

    console.log('📋 Payment report generated:', {
      reportId: report.id,
      type: report.type,
      period: `${start.toDateString()} - ${end.toDateString()}`,
      totalRevenue: analytics.revenue.totalRevenue,
      totalTransactions: analytics.revenue.totalTransactions
    });

    return report;
  }

  /**
   * Get real-time payment metrics
   */
  static async getRealTimeMetrics(): Promise<{
    todayRevenue: number;
    todayTransactions: number;
    onlineUsers: number;
    activeSubscriptions: number;
    pendingPayments: number;
  }> {
    // In production, query real-time data
    return {
      todayRevenue: 345.67,
      todayTransactions: 8,
      onlineUsers: 23,
      activeSubscriptions: 45,
      pendingPayments: 2
    };
  }

  /**
   * Get payment trends over time
   */
  static async getPaymentTrends(
    days: number = 30,
    metric: 'revenue' | 'transactions' | 'subscriptions' = 'revenue'
  ): Promise<Array<{
    date: string;
    value: number;
  }>> {
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Mock trend data - in production, query actual data
      const baseValue = metric === 'revenue' ? 150 : metric === 'transactions' ? 5 : 2;
      const randomVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
      const trendGrowth = i < days / 2 ? 1.02 : 1.01; // Slight upward trend
      
      trends.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(baseValue * Math.pow(trendGrowth, days - i) * (1 + randomVariation) * 100) / 100
      });
    }

    return trends;
  }

  /**
   * Get subscription tier performance
   */
  static async getTierPerformance(): Promise<Array<{
    tier: string;
    name: string;
    subscribers: number;
    revenue: number;
    conversionRate: number;
    averageLifetime: number;
    churnRate: number;
  }>> {
    // Mock tier performance data
    return [
      {
        tier: 'silver',
        name: 'Silver',
        subscribers: 20,
        revenue: 3998.00,
        conversionRate: 15.2,
        averageLifetime: 8.5,
        churnRate: 5.1
      },
      {
        tier: 'gold',
        name: 'Gold',
        subscribers: 18,
        revenue: 7194.00,
        conversionRate: 12.8,
        averageLifetime: 11.2,
        churnRate: 4.3
      },
      {
        tier: 'platinum',
        name: 'Platinum',
        subscribers: 7,
        revenue: 5598.00,
        conversionRate: 8.9,
        averageLifetime: 15.8,
        churnRate: 2.1
      }
    ];
  }

  /**
   * Get payment failure analysis
   */
  static async getPaymentFailures(days: number = 30): Promise<{
    totalFailures: number;
    failureRate: number;
    topReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
    trends: Array<{
      date: string;
      failures: number;
      successRate: number;
    }>;
  }> {
    // Mock payment failure data
    return {
      totalFailures: 12,
      failureRate: 3.2,
      topReasons: [
        { reason: 'Insufficient funds', count: 5, percentage: 41.7 },
        { reason: 'Expired card', count: 3, percentage: 25.0 },
        { reason: 'Invalid card details', count: 2, percentage: 16.7 },
        { reason: 'Bank decline', count: 2, percentage: 16.7 }
      ],
      trends: await this.generateFailureTrends(days)
    };
  }

  /**
   * Export payment data to CSV format
   */
  static async exportToCSV(
    startDate: Date,
    endDate: Date,
    type: 'transactions' | 'subscriptions' | 'revenue' = 'transactions'
  ): Promise<string> {
    // Mock CSV generation
    const headers = type === 'transactions' 
      ? ['Date', 'Transaction ID', 'Amount', 'Currency', 'Status', 'Customer Email']
      : type === 'subscriptions'
      ? ['Date', 'Subscription ID', 'Tier', 'Customer', 'Status', 'Amount']
      : ['Date', 'Revenue', 'Transactions', 'Average Value'];

    const csvData = [
      headers.join(','),
      // Mock data rows
      ...(type === 'transactions' ? [
        '2024-01-15,TXN_123456789,199.99,CAD,completed,customer@example.com',
        '2024-01-14,TXN_123456788,39.99,CAD,completed,business@example.com'
      ] : type === 'subscriptions' ? [
        '2024-01-15,SUB_987654321,gold,Business Owner,active,399.99',
        '2024-01-14,SUB_987654320,silver,Small Business,active,199.99'
      ] : [
        '2024-01-15,945.67,12,78.81',
        '2024-01-14,1234.56,15,82.30'
      ])
    ];

    return csvData.join('\n');
  }

  /**
   * Get date range for report type
   */
  private static getDateRange(
    type: PaymentReport['type'],
    customStart?: Date,
    customEnd?: Date
  ): { start: Date; end: Date } {
    if (customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }

    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (type) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'yearly':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  /**
   * Generate mock failure trends
   */
  private static async generateFailureTrends(days: number): Promise<Array<{
    date: string;
    failures: number;
    successRate: number;
  }>> {
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const failures = Math.floor(Math.random() * 3); // 0-2 failures per day
      const successRate = 95 + Math.random() * 4; // 95-99% success rate
      
      trends.push({
        date: date.toISOString().split('T')[0],
        failures,
        successRate: Math.round(successRate * 100) / 100
      });
    }

    return trends;
  }
}