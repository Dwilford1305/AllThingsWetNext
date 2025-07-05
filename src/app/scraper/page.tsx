'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ScraperResults {
  total: number
  new: number
  updated: number
  errors: string[]
  clearedSeedEvents?: number
}

export default function ScraperPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<ScraperResults | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runScrapers = async (clearSeed: boolean = false) => {
    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      const url = `/api/scraper/events${clearSeed ? '?clearSeed=true' : ''}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.data)
      } else {
        setError(data.error || 'Failed to run scrapers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Event Scrapers</h1>
        
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Run Event Scrapers</h2>
          <p className="text-gray-600 mb-6">
            Scrape events from Connect Wetaskiwin and wetaskiwin.ca to populate the events database with real data.
          </p>
          
          <div className="flex gap-4">
            <Button
              onClick={() => runScrapers(false)}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Running...' : 'Run Scrapers'}
            </Button>
            
            <Button
              onClick={() => runScrapers(true)}
              disabled={isRunning}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              {isRunning ? 'Running...' : 'Clear Seed Data & Run Scrapers'}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="p-6 mb-8 border-red-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </Card>
        )}

        {results && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Scraping Results</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.total}</div>
                <div className="text-sm text-blue-700">Total Events Found</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.new}</div>
                <div className="text-sm text-green-700">New Events</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{results.updated}</div>
                <div className="text-sm text-yellow-700">Updated Events</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            </div>

            {results.clearedSeedEvents !== undefined && (
              <div className="bg-orange-50 p-4 rounded-lg mb-4">
                <div className="text-sm text-orange-700">
                  Cleared {results.clearedSeedEvents} seed events from database
                </div>
              </div>
            )}

            {results.errors.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                <div className="bg-red-50 p-4 rounded-lg">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Scraper Sources</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Connect Wetaskiwin</span>
              <a 
                href="https://connectwetaskiwin.com/calendar-of-events.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View Source
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">City of Wetaskiwin</span>
              <a 
                href="https://wetaskiwin.ca" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View Source
              </a>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> These scrapers are designed to be ethical and respectful. They:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
              <li>Include proper User-Agent headers</li>
              <li>Respect rate limits with timeouts</li>
              <li>Only scrape publicly available information</li>
              <li>Include source attribution and links</li>
              <li>Handle errors gracefully</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
