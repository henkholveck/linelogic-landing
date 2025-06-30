"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const { signUp, isLoading, user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Redirect if already logged in
  if (user) {
    router.push('/queue-testing')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get user's IP address for rate limiting
      let userIP = null
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        userIP = ipData.ip
      } catch (ipError) {
        console.warn('Could not get IP address:', ipError)
      }

      const result = await signUp(email, password, name, userIP)
      if (result.error) {
        if (result.error.message.includes('rate limit') || result.error.message.includes('Too many')) {
          setError('Too many signup attempts from this location. Please try again later.')
        } else if (result.error.message.includes('valid name')) {
          setError('Please enter a valid name (at least 2 characters, letters only)')
        } else {
          setError(result.error.message)
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?message=check-email')
        }, 3000)
      }
    } catch (err: any) {
      if (err.message.includes('rate limit') || err.message.includes('Too many')) {
        setError('Too many signup attempts. Please try again later.')
      } else if (err.message.includes('valid name')) {
        setError('Please enter a valid name (minimum 2 characters, letters only)')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="text-center py-8">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Requested</h2>
            <p className="text-slate-300 mb-4">
              Verify your email to receive diagnostic credits and system access.
            </p>
            <p className="text-sm text-slate-400">
              Redirecting to authentication...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-green-400">LineLogic</CardTitle>
          <p className="text-slate-400">Request system access</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-500">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                minLength={6}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-black font-semibold" 
              disabled={loading || isLoading}
            >
              {loading || isLoading ? 'Processing request...' : 'Request Access'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have access?{' '}
              <Button variant="link" onClick={() => router.push('/login')} className="p-0 text-green-400">
                Sign in
              </Button>
            </p>
            <p className="text-sm text-slate-400 mt-2">
              <Button variant="link" onClick={() => router.push('/faq')} className="p-0 text-slate-300">
                System FAQ
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}