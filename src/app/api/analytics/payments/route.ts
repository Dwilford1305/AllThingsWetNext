import { NextRequest, NextResponse } from 'next/server';
import { PaymentAnalyticsService } from '@/lib/payment-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'analytics' | 'trends' | 'tiers' | 'failures' | 'realtime' | 'export';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '30');
    const metric = searchParams.get('metric') as 'revenue' | 'transactions' | 'subscriptions' || 'revenue';
    const currency = searchParams.get('currency') || 'CAD';

    // Validate date parameters if provided
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid start date format. Use YYYY-MM-DD.',
            code: 'INVALID_START_DATE'
          },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid end date format. Use YYYY-MM-DD.',
            code: 'INVALID_END_DATE'
          },
          { status: 400 }
        );
      }
    }

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        {
          success: false,
          error: 'Days parameter must be between 1 and 365.',
          code: 'INVALID_DAYS'
        },
        { status: 400 }
      );
    }

    switch (type) {
      case 'analytics':
        if (!start || !end) {
          return NextResponse.json(
            {
              success: false,
              error: 'Start date and end date are required for analytics.',
              code: 'MISSING_DATE_RANGE'
            },
            { status: 400 }
          );
        }

        const analytics = await PaymentAnalyticsService.getAnalytics(start, end, currency);
        return NextResponse.json({
          success: true,
          analytics
        });

      case 'trends':
        const trends = await PaymentAnalyticsService.getPaymentTrends(days, metric);
        return NextResponse.json({
          success: true,
          trends,
          metadata: {
            days,
            metric,
            period: `${days} days`
          }
        });

      case 'tiers':
        const tierPerformance = await PaymentAnalyticsService.getTierPerformance();
        return NextResponse.json({
          success: true,
          tiers: tierPerformance
        });

      case 'failures':
        const failures = await PaymentAnalyticsService.getPaymentFailures(days);
        return NextResponse.json({
          success: true,
          failures,
          metadata: {
            days,
            period: `${days} days`
          }
        });

      case 'realtime':
        const realtime = await PaymentAnalyticsService.getRealTimeMetrics();
        return NextResponse.json({
          success: true,
          realtime,
          timestamp: new Date().toISOString()
        });

      case 'export':
        const exportType = searchParams.get('exportType') as 'transactions' | 'subscriptions' | 'revenue' || 'transactions';
        
        if (!start || !end) {
          return NextResponse.json(
            {
              success: false,
              error: 'Start date and end date are required for export.',
              code: 'MISSING_DATE_RANGE'
            },
            { status: 400 }
          );
        }

        const csvData = await PaymentAnalyticsService.exportToCSV(start, end, exportType);
        
        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="payment-${exportType}-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`
          }
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid type parameter. Supported types: analytics, trends, tiers, failures, realtime, export.',
            code: 'INVALID_TYPE'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Payment analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve payment analytics',
        code: 'ANALYTICS_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, reportType, customStart, customEnd, generatedBy } = body;

    if (type !== 'report') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only report generation is supported via POST.',
          code: 'INVALID_POST_TYPE'
        },
        { status: 400 }
      );
    }

    if (!reportType || !['daily', 'weekly', 'monthly', 'yearly'].includes(reportType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid report type is required: daily, weekly, monthly, or yearly.',
          code: 'INVALID_REPORT_TYPE'
        },
        { status: 400 }
      );
    }

    // Parse custom dates if provided
    let start: Date | undefined;
    let end: Date | undefined;

    if (customStart) {
      start = new Date(customStart);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid custom start date format.',
            code: 'INVALID_CUSTOM_START'
          },
          { status: 400 }
        );
      }
    }

    if (customEnd) {
      end = new Date(customEnd);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid custom end date format.',
            code: 'INVALID_CUSTOM_END'
          },
          { status: 400 }
        );
      }
    }

    const report = await PaymentAnalyticsService.generateReport(
      reportType,
      start,
      end,
      generatedBy
    );

    console.log('📊 Payment report generated via API:', {
      reportId: report.id,
      type: report.type,
      generatedBy: report.generatedBy || 'API'
    });

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        type: report.type,
        period: report.period,
        generatedAt: report.generatedAt,
        generatedBy: report.generatedBy
      },
      analytics: report.analytics
    });

  } catch (error) {
    console.error('Payment report generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate payment report',
        code: 'REPORT_GENERATION_ERROR'
      },
      { status: 500 }
    );
  }
}