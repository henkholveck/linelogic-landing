"use client"

import { useState, useEffect } from 'react'
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
  CreditCard, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowLeft,
  DollarSign
} from "lucide-react"
import { db } from '@/lib/supabase'

export default function InjectionPurchasePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [queueId, setQueueId] = useState('')
  const [basePrice, setBasePrice] = useState(0)
  const [packageType, setPackageType] = useState('single')
  const [accountCount, setAccountCount] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentDetails, setPaymentDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const qId = searchParams?.get('queueId')
    const price = searchParams?.get('price')
    
    if (qId) setQueueId(qId)
    if (price) setBasePrice(parseInt(price))
  }, [searchParams])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const calculateTotal = () => {
    let multiplier = 1
    if (packageType === 'bulk5') multiplier = 4.5 // 10% discount
    if (packageType === 'bulk10') multiplier = 8.5 // 15% discount
    if (packageType === 'custom') multiplier = accountCount * 0.9 // 10% discount for custom
    
    return Math.round(basePrice * multiplier)
  }

  const getPackageDescription = () => {
    switch (packageType) {
      case 'single':
        return 'Single account injection'
      case 'bulk5':
        return '5 account injections (10% discount)'
      case 'bulk10':
        return '10 account injections (15% discount)'
      case 'custom':
        return `${accountCount} account injections (10% discount)`
      default:
        return 'Single account injection'
    }
  }

  const handlePurchase = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method')
      return
    }
    if (!paymentDetails.trim()) {
      setError('Please provide payment details')
      return
    }

    setLoading(true)
    setError('')

    try {
      const injectionData = {
        queueId,
        packageType,
        accountCount: packageType === 'custom' ? accountCount : 
                     packageType === 'bulk5' ? 5 :
                     packageType === 'bulk10' ? 10 : 1,
        totalPrice: calculateTotal(),
        paymentMethod,
        paymentDetails
      }

      // Save injection order
      const { data, error: saveError } = await db.saveInjectionRecord(user!.id, injectionData)
      if (saveError) throw saveError

      // Save payment receipt for manual verification
      await db.savePaymentReceipt(user!.id, {
        paymentType: paymentMethod,
        serviceType: 'queue_injection',
        amount: calculateTotal(),
        receiptId: data.id
      })

      setSuccess(true)
      
    } catch (err: any) {
      setError(err.message || 'Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Received!</h2>
            <p className="text-gray-600 mb-4">
              Your injection order is being processed. You'll receive delivery details within 15 minutes.
            </p>
            <Button onClick={() => router.push('/queue-testing')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Juice Injection Purchase</h1>
              <p className="text-gray-600">Queue ID: {queueId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Package Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Select Package</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      packageType === 'single' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPackageType('single')}
                  >
                    <div className="font-semibold">Single Injection</div>
                    <div className="text-sm text-gray-600">1 account</div>
                    <div className="text-lg font-bold text-orange-600">${basePrice}</div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      packageType === 'bulk5' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPackageType('bulk5')}
                  >
                    <div className="font-semibold flex items-center space-x-2">
                      <span>Bulk 5</span>
                      <Badge variant="secondary">10% off</Badge>
                    </div>
                    <div className="text-sm text-gray-600">5 accounts</div>
                    <div className="text-lg font-bold text-orange-600">${Math.round(basePrice * 4.5)}</div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      packageType === 'bulk10' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPackageType('bulk10')}
                  >
                    <div className="font-semibold flex items-center space-x-2">
                      <span>Bulk 10</span>
                      <Badge variant="secondary">15% off</Badge>
                    </div>
                    <div className="text-sm text-gray-600">10 accounts</div>
                    <div className="text-lg font-bold text-orange-600">${Math.round(basePrice * 8.5)}</div>
                  </div>

                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      packageType === 'custom' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPackageType('custom')}
                  >
                    <div className="font-semibold flex items-center space-x-2">
                      <span>Custom</span>
                      <Badge variant="secondary">10% off</Badge>
                    </div>
                    <div className="text-sm text-gray-600">Choose quantity</div>
                    <div className="text-lg font-bold text-orange-600">${Math.round(basePrice * accountCount * 0.9)}</div>
                  </div>
                </div>

                {packageType === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Accounts (2-50)
                    </label>
                    <Input
                      type="number"
                      min="2"
                      max="50"
                      value={accountCount}
                      onChange={(e) => setAccountCount(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
                      className="w-32"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="cashapp">Cash App</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Details (Transaction ID, Address, etc.)
                  </label>
                  <Input
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="Enter payment confirmation details"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Package</span>
                    <span>{getPackageDescription()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Queue ID</span>
                    <span className="font-mono text-xs">{queueId}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal()}</span>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>99.9% success rate</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <Clock className="h-4 w-4" />
                    <span>Instant delivery</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <Shield className="h-4 w-4" />
                    <span>Money-back guarantee</span>
                  </div>
                </div>

                <Button 
                  onClick={handlePurchase}
                  disabled={loading || !paymentMethod || !paymentDetails.trim()}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Purchase Injection
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Your order will be processed manually within 15 minutes. 
                  Contact support for urgent requests.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
