"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QueueAnalyzer from "@/components/QueueAnalyzer"
import { AlertCircle, CreditCard, Zap } from "lucide-react"

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
                {!user.email_verified && (
                  <Badge variant="destructive" className="text-xs">
                    Email not verified
                  </Badge>
                )}
              </div>
              <Badge 
                variant={user.credits >= 5 ? "default" : "destructive"}
                className="flex items-center space-x-1"
              >
                <CreditCard className="h-3 w-3" />
                <span>{user.credits} Credits</span>
              </Badge>
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
        {/* Email Verification Warning */}
        {!user.email_verified && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Email Verification Required</h3>
                  <p className="text-sm text-yellow-700">
                    Please check your email and verify your account to receive your 10 welcome credits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Credits Warning */}
        {user.email_verified && user.credits < 5 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-800">Insufficient Credits</h3>
                    <p className="text-sm text-red-700">
                      You need at least 5 credits to run queue analysis. 
                    </p>
                  </div>
                </div>
                <Button onClick={() => router.push('/credits')} size="sm">
                  Buy Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Message for New Users */}
        {user.email_verified && user.credits >= 5 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">Welcome to LineLogic!</h2>
                  <p className="text-blue-800">
                    Analyze queue wait times, get optimization tips, and access our premium injection services.
                  </p>
                  <div className="mt-2 text-sm text-blue-700">
                    <strong>How it works:</strong> Enter any queue URL → Get detailed analysis (5 credits) → 
                    Optionally purchase queue bypass service
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue Analyzer Component */}
        <QueueAnalyzer />
      </div>
    </div>
  )
}
