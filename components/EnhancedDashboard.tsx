"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  CreditCard,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import TestingInterface from '@/components/TestingInterface'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  total_tests: number
  total_injections: number
  credits_spent: number
  avg_queue_position: number
  avg_improvement: number
  current_credits: number
  success_rate: number
  recent_tests: any[]
  recent_injections: any[]
}

export default function EnhancedDashboard() {
  const { user, refreshUser } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadDashboardStats()
    }
  }, [user])

  const loadDashboardStats = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        user_uuid: user.id
      })

      if (error) throw error
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPositionColor = (position: number) => {
    if (position <= 1000) return 'text-green-600'
    if (position <= 10000) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={loadDashboardStats} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Total Tests</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.total_tests || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-orange-600 mb-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Injections</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.total_injections || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Avg Improvement</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.avg_improvement ? `${stats.avg_improvement.toFixed(1)}%` : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-purple-600 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Credits</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {user?.credits || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="testing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-6">
          <TestingInterface />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recent_tests?.length ? (
                    stats.recent_tests.map((test: any) => (
                      <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{test.email}</div>
                          <div className="text-xs text-gray-500">
                            {test.test_type} • {formatDate(test.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${getPositionColor(test.queue_position)}`}>
                            #{test.queue_position.toLocaleString()}
                          </div>
                          <Badge variant={test.success ? "default" : "destructive"} className="text-xs">
                            {test.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No tests yet. Run your first test!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Injections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Recent Injections</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recent_injections?.length ? (
                    stats.recent_injections.map((injection: any) => (
                      <div key={injection.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{injection.email}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(injection.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-700">
                            +{injection.performance_gain.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">
                            #{injection.original_position.toLocaleString()} → #{injection.new_position.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No injections yet. Try injecting after a test!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.success_rate ? `${stats.success_rate.toFixed(1)}%` : '0%'}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Based on {stats?.total_tests || 0} tests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avg Queue Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getPositionColor(stats?.avg_queue_position || 0)}`}>
                  #{stats?.avg_queue_position ? Math.round(stats.avg_queue_position).toLocaleString() : '0'}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Across all tests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Credits Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.credits_spent || 0}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Total credits used
                </p>
              </CardContent>
            </Card>
          </div>

          {user?.credits === 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">No Credits Remaining</h3>
                    <p className="text-red-700">
                      Purchase credits to continue testing and using injection services.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/credits'}
                      className="mt-3 bg-red-600 hover:bg-red-700"
                    >
                      Buy Credits
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
