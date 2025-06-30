"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function QueueTestingPage() {
  const { user, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please Sign In</h1>
          <p className="text-gray-600 mt-2">You need to be logged in to access this page</p>
          <Button onClick={() => router.push('/login')} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">LineLogic</h1>
              <p className="text-gray-600">Queue Analysis & Injection Tool</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <Button variant="outline" size="sm">
                {user.credits} Credits
              </Button>
              <Button onClick={() => router.push('/credits')} variant="outline" size="sm">
                Buy Credits
              </Button>
              {isAdmin && (
                <Button onClick={() => router.push('/admin')} variant="outline">
                  Admin Panel
                </Button>
              )}
              <Button onClick={() => router.push('/logout')} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Queue Testing Tool</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Welcome back! Your account has {user.credits} credits available.
              </p>
              
              {isAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900">Admin Access Detected</h3>
                  <p className="text-blue-800">You have admin privileges and can access the admin panel.</p>
                  <Button onClick={() => router.push('/admin')} className="mt-2">
                    Go to Admin Panel
                  </Button>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900">Under Development</h3>
                <p className="text-yellow-800">
                  The queue testing functionality is currently being rebuilt to use the proper 
                  authentication system. Your credits and account data are now properly managed 
                  through the database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}