"use client"
import { useState, useCallback, useEffect } from 'react'

interface DevCaptchaProps {
  onSolved: (token: string) => void
  className?: string
}

// Simple development CAPTCHA: user solves a basic arithmetic challenge.
// On correct answer, we emit a random token (>=10 chars) acceptable to backend verifyCaptcha.
export function DevCaptcha({ onSolved, className }: DevCaptchaProps) {
  const [a, setA] = useState(0)
  const [b, setB] = useState(0)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)

  const generate = useCallback(() => {
    setA(Math.floor(Math.random() * 10) + 1)
    setB(Math.floor(Math.random() * 10) + 1)
    setAnswer('')
    setError('')
    setToken(null)
  }, [])

  useEffect(() => { generate() }, [generate])

  const verify = () => {
    if (Number(answer) === a + b) {
      const t = `dev_${crypto.randomUUID().replace(/-/g,'')}` // length > 10
      setToken(t)
      setError('')
      onSolved(t)
    } else {
      setError('Incorrect answer, try again.')
      setToken(null)
    }
  }

  return (
    <div className={className}>
      <div className="p-3 border rounded-md bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Development CAPTCHA</span>
          <button type="button" onClick={generate} className="text-xs text-blue-600 hover:underline">New</button>
        </div>
        {token ? (
          <div className="text-green-600 text-sm">✔ Solved</div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-700">What is <span className="font-semibold">{a} + {b}</span> ?</div>
            <div className="flex gap-2">
              <input
                type="number"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                className="w-full px-2 py-1 border rounded-md text-sm"
                placeholder="Your answer"
              />
              <button type="button" onClick={verify} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Verify</button>
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
          </div>
        )}
        <div className="mt-2 text-[10px] text-gray-500">(Shown only in development. Set NEXT_PUBLIC_DEV_CAPTCHA=false to hide.)</div>
      </div>
    </div>
  )
}
