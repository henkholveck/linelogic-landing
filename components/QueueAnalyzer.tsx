"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Clock, 
  TrendingUp, 
  Users, 
  Target, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign
} from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/supabase'

interface AnalysisResult {
  queueId: string
  url: string
  estimatedWaitTime: number
  queuePosition: number
  totalInQueue: number
  successRate: number
  peakTimes: string[]
  recommendations: string[]
  canInject: boolean
  injectionPrice: number
}

export default function QueueAnalyzer() {
  const { user, refreshUser } = useAuth()
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a URL to analyze')
      return
    }

    if (!user || user.credits < 5) {
      setError('Insufficient credits. You need 5 credits to run an analysis.')
      return
    }

    setAnalyzing(true)
    setError('')

    try {
      // Simulate analysis (replace with real queue analysis logic)
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Mock analysis results (replace with real API call)
      const mockResult: AnalysisResult = {
        queueId: Math.random().toString(36).substr(2, 9),
        url: url,
        estimatedWaitTime: Math.floor(Math.random() * 120) + 5, // 5-125 minutes
        queuePosition: Math.floor(Math.random() * 1000) + 1,
        totalInQueue: Math.floor(Math.random() * 5000) + 100,
        successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        peakTimes: ['12:00 PM', '6:00 PM', '8:00 PM'],
        recommendations: [
          'Best time to join: Early morning (6-9 AM)',
          'Avoid peak hours (12-2 PM, 6-9 PM)',
          'Success rate is higher on weekdays',
          'Clear browser cache before joining queue'
        ],
        canInject: Math.random() > 0.3,
        injectionPrice: Math.floor(Math.random() * 50) + 25 // $25-75
      }

      // Deduct credits and save result
      const deductResult = await db.deductCredits(user.id, 5, `Queue analysis: ${url}`)
      if (deductResult.error) {
        throw new Error(deductResult.error.message)
      }

      // Save analysis result
      await db.saveAnalysisResult(user.id, {
        email: user.email,
        url: url,
        result: mockResult
      })

      setResult(mockResult)
      await refreshUser() // Refresh to update credit count
      
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handlePurchaseInjection = async () => {
    if (!result) return
    
    // Redirect to injection purchase flow
    window.location.href = `/injection-purchase?queueId=${result.queueId}&price=${result.injectionPrice}`
  }

  return (
    <div className="space-y-6">
      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Queue Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Queue URL or Website
            </label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/queue or product URL"
              disabled={analyzing}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Analysis cost: <strong>5 credits</strong>
            </div>
            <Button 
              onClick={handleAnalyze}
              disabled={analyzing || !user || user.credits < 5}
              className="flex items-center space-x-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  <span>Analyze Queue</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analysis Results</span>
              <Badge variant="outline">Queue ID: {result.queueId}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="injection">Juice Injection</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-600 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Wait Time</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {result.estimatedWaitTime}m
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 text-green-600 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Position</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      #{result.queuePosition}
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 text-orange-600 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">Total Queue</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">
                      {result.totalInQueue.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 text-purple-600 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {result.successRate}%
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Queue URL</h4>
                  <p className="text-sm text-gray-600 break-all">{result.url}</p>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Info className="h-4 w-4" />
                      <span>Peak Times</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.peakTimes.map((time, index) => (
                        <Badge key={index} variant="secondary">{time}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="injection" className="space-y-4">
                {result.canInject ? (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <Zap className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Juice Injection Available</h3>
                        <p className="text-sm text-gray-600">Skip the queue and get instant access</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">Premium Queue Skip</span>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600">${result.injectionPrice}</div>
                            <div className="text-xs text-gray-500">one-time fee</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>• Instant queue bypass</div>
                          <div>• 99.9% success guarantee</div>
                          <div>• Priority support</div>
                          <div>• Save {result.estimatedWaitTime} minutes</div>
                        </div>
                      </div>

                      <Button 
                        onClick={handlePurchaseInjection}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        size="lg"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Purchase Juice Injection - ${result.injectionPrice}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        Secure payment • Money-back guarantee • Instant delivery
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Injection Not Available</h3>
                    <p className="text-gray-600 mb-4">
                      This queue system has strong anti-bypass measures. 
                      Our injection service is not currently available for this target.
                    </p>
                    <div className="text-sm text-gray-500">
                      We recommend following the optimization tips in the Insights tab.
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
