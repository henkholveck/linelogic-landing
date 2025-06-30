"use client"

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Zap, 
  Activity, 
  Shield, 
  CheckCircle,
  ArrowLeft,
  Settings,
  Target
} from "lucide-react"
import { db } from '@/lib/supabase'

function InjectionContent() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [email, setEmail] = useState('')
  const [currentPosition, setCurrentPosition] = useState(0)
  const [price, setPrice] = useState(0)
  const [projectedRange, setProjectedRange] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentDetails, setPaymentDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [injecting, setInjecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState('')

  useEffect(() => {
    const emailParam = searchParams?.get('email') || ''
    const positionParam = searchParams?.get('position') || '0'
    const priceParam = searchParams?.get('price') || '0'
    const rangeParam = searchParams?.get('range') || ''
    
    setEmail(emailParam)
    setCurrentPosition(parseInt(positionParam))
    setPrice(parseInt(priceParam))
    setProjectedRange(rangeParam)
  }, [searchParams])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handlePurchase = async () => {
    if (!paymentMethod) {
      setError('Select payment method for priority injection')
      return
    }
    if (!paymentDetails.trim()) {
      setError('Provide payment confirmation details')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Save injection order
      const injectionData = {
        email,
        currentPosition,
        projectedRange,
        totalPrice: price,
        paymentMethod,
        paymentDetails
      }

      const { data, error: saveError } = await db.saveInjectionRecord(user!.id, injectionData)
      if (saveError) throw saveError

      // Save payment receipt
      await db.savePaymentReceipt(user!.id, {
        paymentType: paymentMethod,
        serviceType: 'priority_injection',
        amount: price,
        receiptId: data.id
      })

      // Start injection simulation
      setInjecting(true)
      setLoading(false)

      const injectionSteps = [
        'Authenticating with allocation system...',
        'Locating account in traffic pipeline...',
        'Analyzing current placement signals...',
        'Modifying priority indicators...',
        'Propagating changes to load balancer...',
        'Verifying injection success...',
        'Priority signal active'
      ]

      for (let i = 0; i < injectionSteps.length; i++) {
        setCurrentStep(injectionSteps[i])
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500))
      }

      setSuccess(true)
      
    } catch (err: any) {
      setError(err.message || 'Injection failed. System temporarily unavailable.')
    } finally {
      setLoading(false)
      setInjecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="text-center py-8">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-2">Injection Complete</h2>
            <p className="text-slate-300 mb-4">
              Priority signal activated for {email}. 
              New projected range: <strong className="text-green-400">{projectedRange}</strong>
            </p>
            <div className="bg-slate-700 p-4 rounded-lg mb-4">
              <div className="text-sm text-slate-400 mb-2">System Status:</div>
              <div className="text-green-400 font-mono text-sm">INJECTION_ACTIVE</div>
            </div>
            <Button onClick={() => router.push('/queue-testing')} className="w-full bg-green-600 hover:bg-green-700 text-black">
              Return to Diagnostics
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (injecting) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardContent className="text-center py-8">
            <div className="mb-6">
              <div className="animate-pulse text-4xl text-green-400 mb-4">⚡</div>
              <h2 className="text-2xl font-bold text-white mb-2">Injecting Priority Signal</h2>
              <p className="text-slate-300">Do not close this window</p>
            </div>
            
            <div className="bg-slate-700 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-3 justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                <span className="text-green-400 font-mono text-sm">{currentStep}</span>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Injection typically completes within 10-15 seconds
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4 text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Priority Injection</h1>
              <p className="text-slate-400">Account: {email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Injection Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Target className="h-5 w-5" />
                  <span>Account Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="text-sm text-slate-400">Current Position</div>
                    <div className="text-2xl font-bold text-white">#{currentPosition.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <div className="text-sm text-slate-400">Projected Range</div>
                    <div className="text-2xl font-bold text-green-400">{projectedRange}</div>
                  </div>
                </div>

                <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-lg">
                  <div className="text-sm text-orange-300 mb-2">Signal Analysis:</div>
                  <div className="text-white text-sm">
                    This account's entropy pattern indicates suboptimal placement. 
                    Priority injection will modify traffic signals to improve queue positioning.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Settings className="h-5 w-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Confirmation (TX ID, Reference, etc.)
                  </label>
                  <Input
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="Enter payment confirmation details"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-500">
                    <AlertDescription className="text-red-300">{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Injection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Account</span>
                    <span className="text-white font-mono text-xs">{email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Service</span>
                    <span className="text-green-400">Priority Injection</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Processing</span>
                    <span className="text-white">Manual (10-15 min)</span>
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-white">Total</span>
                  <span className="text-green-400">${price}</span>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center space-x-2 text-sm text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Signal modification</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-400">
                    <Activity className="h-4 w-4" />
                    <span>Real-time injection</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-400">
                    <Shield className="h-4 w-4" />
                    <span>Secure processing</span>
                  </div>
                </div>

                <Button 
                  onClick={handlePurchase}
                  disabled={loading || !paymentMethod || !paymentDetails.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 text-black font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Execute Injection
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-400 text-center">
                  Injection will be processed manually within 15 minutes. 
                  Priority placement signals activate immediately upon verification.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InjectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    }>
      <InjectionContent />
    </Suspense>
  )
}
