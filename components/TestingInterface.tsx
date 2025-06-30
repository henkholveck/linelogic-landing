"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Zap, 
  Clock, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import { InjectionService } from '@/lib/injection-service'

interface TestResult {
  id: string
  email: string
  testType: 'basic' | 'advanced' | 'premium'
  queuePosition: number
  latency: number
  success: boolean
  timestamp: Date
  injectionApplied: boolean
}

interface InjectionResult {
  id: string
  email: string
  originalPosition: number
  newPosition: number
  performanceGain: number
  status: string
}

export default function TestingPage() {
  const { user, refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [testType, setTestType] = useState<'basic' | 'advanced' | 'premium'>('basic')
  const [testing, setTesting] = useState(false)
  const [injecting, setInjecting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [injectionResult, setInjectionResult] = useState<InjectionResult | null>(null)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState('')

  const getTestCost = (type: string) => {
    switch (type) {
      case 'basic': return 5
      case 'advanced': return 10
      case 'premium': return 20
      default: return 5
    }
  }

  const getInjectionCost = (position: number) => {
    if (position > 50000) return 25
    if (position > 10000) return 35
    if (position > 5000) return 50
    if (position > 1000) return 75
    return 100
  }

  const runTest = async () => {
    if (!email.trim()) {
      setError('Please enter an email address to test')
      return
    }

    if (!user || user.credits < getTestCost(testType)) {
      setError(`Insufficient credits. ${testType} test requires ${getTestCost(testType)} credits.`)
      return
    }

    setTesting(true)
    setError('')
    setTestResult(null)
    setInjectionResult(null)

    const steps = [
      'Connecting to queue infrastructure...',
      'Analyzing account placement...',
      'Testing latency and performance...',
      'Generating results...'
    ]

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500))
      }

      const result = await InjectionService.runAccountTest(user.id, email, testType)
      setTestResult(result)
      await refreshUser()

    } catch (err: any) {
      setError(err.message || 'Test failed. Please try again.')
    } finally {
      setTesting(false)
      setCurrentStep('')
    }
  }

  const executeInjection = async () => {
    if (!testResult || !user) return

    const injectionCost = getInjectionCost(testResult.queuePosition)
    
    if (user.credits < injectionCost) {
      setError(`Insufficient credits. Injection requires ${injectionCost} credits.`)
      return
    }

    setInjecting(true)
    setError('')

    const injectionSteps = [
      'Authenticating with queue system...',
      'Locating account in traffic pipeline...',
      'Applying juice injection...',
      'Optimizing queue position...',
      'Verifying improvements...'
    ]

    try {
      for (let i = 0; i < injectionSteps.length; i++) {
        setCurrentStep(injectionSteps[i])
        await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800))
      }

      const result = await InjectionService.executeInjection(
        user.id, 
        testResult.email, 
        testResult.queuePosition
      )
      
      setInjectionResult(result)
      await refreshUser()

    } catch (err: any) {
      setError(err.message || 'Injection failed. Please try again.')
    } finally {
      setInjecting(false)
      setCurrentStep('')
    }
  }

  const getPositionColor = (position: number) => {
    if (position <= 1000) return 'text-green-600'
    if (position <= 10000) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLatencyColor = (latency: number) => {
    if (latency <= 100) return 'text-green-600'
    if (latency <= 150) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Test Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Queue Testing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to test"
              disabled={testing || injecting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['basic', 'advanced', 'premium'] as const).map((type) => (
                <div
                  key={type}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    testType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setTestType(type)}
                >
                  <div className="font-semibold capitalize">{type}</div>
                  <div className="text-sm text-gray-600">{getTestCost(type)} credits</div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(testing || injecting) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">{currentStep}</span>
              </div>
            </div>
          )}

          <Button 
            onClick={runTest}
            disabled={testing || injecting || !user || user.credits < getTestCost(testType)}
            className="w-full"
          >
            {testing ? 'Running Test...' : `Run ${testType} Test (${getTestCost(testType)} credits)`}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Test Results</span>
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Queue Position</span>
                </div>
                <div className={`text-2xl font-bold ${getPositionColor(testResult.queuePosition)}`}>
                  #{testResult.queuePosition.toLocaleString()}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Latency</span>
                </div>
                <div className={`text-2xl font-bold ${getLatencyColor(testResult.latency)}`}>
                  {testResult.latency}ms
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Test Type</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 capitalize">
                  {testResult.testType}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Analysis</h4>
              <p className="text-yellow-700 text-sm">
                {testResult.queuePosition > 10000 
                  ? 'Account shows poor queue placement. Injection recommended for significant improvement.'
                  : testResult.queuePosition > 1000
                  ? 'Moderate queue position. Injection may provide good improvement.'
                  : 'Excellent queue position. Injection will provide minimal improvement.'
                }
              </p>
            </div>

            {testResult.success && !injectionResult && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Juice Injection Available</h3>
                    <p className="text-gray-600 mb-2">
                      Improve queue position by an estimated 60-85%
                    </p>
                    <div className="text-sm text-gray-500">
                      Cost: {getInjectionCost(testResult.queuePosition)} credits
                    </div>
                  </div>
                  <Button
                    onClick={executeInjection}
                    disabled={injecting || !user || user.credits < getInjectionCost(testResult.queuePosition)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {injecting ? 'Injecting...' : 'Apply Injection'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Injection Results */}
      {injectionResult && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <Zap className="h-5 w-5" />
              <span>Injection Complete</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 mb-1">Original Position</div>
                <div className="text-2xl font-bold text-green-900">
                  #{injectionResult.originalPosition.toLocaleString()}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 mb-1">New Position</div>
                <div className="text-2xl font-bold text-green-900">
                  #{injectionResult.newPosition.toLocaleString()}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 mb-1">Improvement</div>
                <div className="text-2xl font-bold text-green-900">
                  {injectionResult.performanceGain.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-100 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Injection successful!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Account performance improved by {injectionResult.performanceGain.toFixed(1)}%. 
                Position advanced by {(injectionResult.originalPosition - injectionResult.newPosition).toLocaleString()} places.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
