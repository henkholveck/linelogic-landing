"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AccountTester from "@/components/AccountTester"
import { AlertCircle, CreditCard, Activity, Shield, Eye } from "lucide-react"

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Establishing secure connection...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
          <p className="text-slate-400 mt-2">Authentication required for diagnostic access</p>
          <Button onClick={() => router.push('/login')} className="mt-4 bg-green-600 hover:bg-green-700">
            Authenticate
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-green-400">LineLogic</h1>
              <p className="text-slate-300">Allocation System Diagnostics</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline" className="border-green-400 text-green-400 text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  LIVE PIPELINE
                </Badge>
                <Badge variant="outline" className="border-blue-400 text-blue-400 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  ENCRYPTED
                </Badge>
                <Badge variant="outline" className="border-orange-400 text-orange-400 text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  PARTNER ACCESS
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
                {!user.email_verified && (
                  <Badge variant="destructive" className="text-xs">
                    Verification Required
                  </Badge>
                )}
              </div>
              <Badge 
                variant={user.credits >= 5 ? "default" : "destructive"}
                className={`flex items-center space-x-1 ${user.credits >= 5 ? 'bg-green-600' : 'bg-red-600'}`}
              >
                <CreditCard className="h-3 w-3" />
                <span>{user.credits} Credits</span>
              </Badge>
              <Button onClick={() => router.push('/credits')} variant="outline" size="sm" className="border-slate-600 text-slate-300">
                Add Credits
              </Button>
              {isAdmin && (
                <Button onClick={() => router.push('/admin')} variant="outline" className="border-slate-600 text-slate-300">
                  System Admin
                </Button>
              )}
              <Button onClick={() => router.push('/logout')} variant="outline" className="border-slate-600 text-slate-300">
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Verification Warning */}
        {!user.email_verified && (
          <Card className="mb-6 border-yellow-600 bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-yellow-300">Access Verification Required</h3>
                  <p className="text-sm text-yellow-400">
                    Verify your email to receive diagnostic credits and full system access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Credits Warning */}
        {user.email_verified && user.credits < 5 && (
          <Card className="mb-6 border-red-600 bg-red-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-red-400" />
                  <div>
                    <h3 className="font-semibold text-red-300">Insufficient Credits</h3>
                    <p className="text-sm text-red-400">
                      Diagnostic sessions require 5 credits. Add credits to continue testing.
                    </p>
                  </div>
                </div>
                <Button onClick={() => router.push('/credits')} size="sm" className="bg-red-600 hover:bg-red-700">
                  Add Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        {user.email_verified && user.credits >= 5 && (
          <Card className="mb-6 border-green-600 bg-green-900/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <Activity className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-300">System Online</h2>
                  <p className="text-green-400">
                    Connected to allocation pipeline. Ready for account diagnostics.
                  </p>
                  <div className="mt-2 text-sm text-slate-400">
                    <strong>How it works:</strong> Enter email addresses → Get placement diagnostics → 
                    Optional priority injection available
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Tester Component */}
        <AccountTester />

        {/* System Information */}
        <Card className="mt-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-200">System Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>Pipeline Status:</span>
              <span className="text-green-400">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span>Mirror Sync:</span>
              <span className="text-green-400">REALTIME</span>
            </div>
            <div className="flex justify-between">
              <span>Access Level:</span>
              <span className="text-orange-400">PARTNER</span>
            </div>
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span className="text-slate-300">{new Date().toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
