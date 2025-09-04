import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { authenticate } from '@/lib/auth-middleware'
import type { ApiResponse } from '@/types'

// This endpoint manages global ad visibility for testing purposes
// It stores the setting in a simple admin configuration collection

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Verify super admin authentication
    const authResult = await authenticate(request)
    if (authResult.error || authResult.user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      )
    }

    const { adsVisible } = await request.json()

    // Store the ad visibility setting in a simple admin config
    // For now, we'll use environment-like storage since this is for testing
    const mongoose = require('mongoose')
    const AdminConfig = mongoose.models.AdminConfig || mongoose.model('AdminConfig', new mongoose.Schema({
      key: { type: String, unique: true, required: true },
      value: mongoose.Schema.Types.Mixed,
      updatedAt: { type: Date, default: Date.now }
    }))

    await AdminConfig.findOneAndUpdate(
      { key: 'test_ads_visible' },
      { 
        value: Boolean(adsVisible),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    console.log(`🔄 Test ad visibility updated: ${adsVisible ? 'enabled' : 'disabled'}`)

    const response: ApiResponse<{ adsVisible: boolean }> = {
      success: true,
      data: { adsVisible: Boolean(adsVisible) },
      message: `Ads are now ${adsVisible ? 'enabled' : 'disabled'} - refresh pages to see changes`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Ad visibility update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update ad visibility' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()

    const mongoose = require('mongoose')
    const AdminConfig = mongoose.models.AdminConfig || mongoose.model('AdminConfig', new mongoose.Schema({
      key: { type: String, unique: true, required: true },
      value: mongoose.Schema.Types.Mixed,
      updatedAt: { type: Date, default: Date.now }
    }))

    const config = await AdminConfig.findOne({ key: 'test_ads_visible' })
    const adsVisible = config?.value !== false // Default to true if not set

    return NextResponse.json({
      success: true,
      data: { adsVisible }
    })

  } catch (error) {
    console.error('Ad visibility fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ad visibility status' 
      },
      { status: 500 }
    )
  }
}