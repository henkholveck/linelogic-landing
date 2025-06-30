"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, CreditCard, DollarSign } from "lucide-react"

export default function CreditsPage() {
  const { user, isLoading, refreshCredits } = useAuth()
  const router = useRouter()
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedCredits, setSelectedCredits] = useState(0)
  const [selectedPrice, setSelectedPrice] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentData, setPaymentData] = useState('')
  const [venmoUsername, setVenmoUsername] = useState('')

  // Venmo configuration
  const VENMO_USERNAME = 'linelogicpay'
  
  const generateVenmoLink = (amount: number, credits: number) => {
    const note = encodeURIComponent(`LineLogic ${credits} Credits Purchase`)
    return `https://venmo.com/${VENMO_USERNAME}?txn=pay&amount=${amount}&note=${note}&audience=private`
  }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

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
    router.push('/login')
    return null
  }

  const creditPackages = [
    { credits: 50, price: 25, popular: false },
    { credits: 100, price: 45, popular: true },
    { credits: 250, price: 100, popular: false },
    { credits: 500, price: 180, popular: false },
  ]

  const handleSelectPackage = (credits: number, price: number) => {
    setSelectedCredits(credits)
    setSelectedPrice(price)
    setShowPaymentForm(true)
  }

  const handleSubmitPayment = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method')
      return
    }

    if (paymentMethod === 'venmo' && !venmoUsername) {
      alert('Please enter your Venmo username')
      return
    }

    if ((paymentMethod === 'bitcoin' || paymentMethod === 'ethereum') && !paymentData) {
      alert('Please enter your transaction ID')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Save payment receipt for manual verification in admin panel
      const receiptData = {
        paymentType: paymentMethod,
        serviceType: 'credits',
        amount: selectedPrice,
        receiptId: paymentMethod === 'venmo' ? venmoUsername : paymentData,
        creditsToAdd: selectedCredits,
        additionalInfo: paymentMethod === 'venmo' ? `Venmo Username: ${venmoUsername}` : `Transaction ID: ${paymentData}`
      }

      // In a real implementation, you'd call your API here to save the payment receipt
      // await db.savePaymentReceipt(user.id, receiptData)
      
      setSuccessMessage(`Payment submitted! You'll receive ${selectedCredits} credits after manual verification by our team.`)
      setShowPaymentForm(false)
      setPaymentData('')
      setVenmoUsername('')
      setPaymentMethod('')
      
    } catch (error) {
      console.error('Payment submission error:', error)
      alert('Failed to submit payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">LineLogic Credits</h1>
              <p className="text-gray-600">Purchase credits for queue analysis</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <Button variant="outline" size="sm">
                {user.credits} Credits
              </Button>
              <Button onClick={() => router.push('/queue-testing')} variant="outline">
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {creditPackages.map((pkg) => (
            <Card 
              key={pkg.credits} 
              className={`relative ${pkg.popular ? 'border-blue-500 border-2' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {pkg.credits} Credits
                </CardTitle>
                <p className="text-3xl font-bold text-blue-600">${pkg.price}</p>
                <p className="text-sm text-gray-500">
                  ${(pkg.price / pkg.credits).toFixed(2)} per credit
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleSelectPackage(pkg.credits, pkg.price)}
                  className="w-full"
                  variant={pkg.popular ? "default" : "outline"}
                >
                  Select Package
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Purchase {selectedCredits} Credits</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">${selectedPrice}</p>
                  <p className="text-sm text-gray-600">Total Amount</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === 'venmo' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('venmo')}
                      className="flex flex-col items-center p-4"
                    >
                      <DollarSign className="h-5 w-5 mb-1" />
                      <span className="text-xs">Venmo</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'bitcoin' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('bitcoin')}
                      className="flex flex-col items-center p-4"
                    >
                      <CreditCard className="h-5 w-5 mb-1" />
                      <span className="text-xs">Bitcoin</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'ethereum' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('ethereum')}
                      className="flex flex-col items-center p-4"
                    >
                      <CreditCard className="h-5 w-5 mb-1" />
                      <span className="text-xs">Ethereum</span>
                    </Button>
                  </div>
                </div>

                {paymentMethod && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Payment Instructions</h4>
                    {paymentMethod === 'venmo' && (
                      <div className="text-blue-800 text-sm space-y-2">
                        <p>Click the button below to pay via Venmo:</p>
                        <Button 
                          onClick={() => window.open(generateVenmoLink(selectedPrice, selectedCredits), '_blank')}
                          className="w-full bg-blue-500 hover:bg-blue-600"
                        >
                          Pay ${selectedPrice} via Venmo
                        </Button>
                        <p className="text-xs">After payment, enter your Venmo username below for verification.</p>
                      </div>
                    )}
                    {paymentMethod === 'bitcoin' && (
                      <div className="text-blue-800 text-sm">
                        <p>Send ${selectedPrice} worth of Bitcoin to:</p>
                        <p className="font-mono text-xs break-all bg-white p-2 rounded mt-1">
                          [BTC_ADDRESS_HERE]
                        </p>
                        <p className="text-xs mt-2">After sending, enter your transaction ID below.</p>
                      </div>
                    )}
                    {paymentMethod === 'ethereum' && (
                      <div className="text-blue-800 text-sm">
                        <p>Send ${selectedPrice} worth of Ethereum to:</p>
                        <p className="font-mono text-xs break-all bg-white p-2 rounded mt-1">
                          [ETH_ADDRESS_HERE]
                        </p>
                        <p className="text-xs mt-2">After sending, enter your transaction ID below.</p>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'venmo' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Venmo Username
                    </label>
                    <Input
                      value={venmoUsername}
                      onChange={(e) => setVenmoUsername(e.target.value)}
                      placeholder="Enter your Venmo username (e.g., @johndoe)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the username you sent the payment from for verification
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID / Hash
                    </label>
                    <Input
                      value={paymentData}
                      onChange={(e) => setPaymentData(e.target.value)}
                      placeholder="Enter your transaction ID or hash"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Copy and paste the transaction ID from your crypto wallet
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleSubmitPayment}
                  disabled={
                    !paymentMethod || 
                    (paymentMethod === 'venmo' && !venmoUsername) ||
                    ((paymentMethod === 'bitcoin' || paymentMethod === 'ethereum') && !paymentData) ||
                    isSubmitting
                  }
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Payment Verification'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Credits will be manually added to your account after payment verification (usually within 24 hours)
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>How Credits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What you get:</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Queue position analysis (5 credits)</li>
                  <li>• Historical data access (1 credit)</li>
                  <li>• Injection services (varies by package)</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment info:</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• All payments verified manually by our team</li>
                  <li>• Credits added within 24 hours of verification</li>
                  <li>• Venmo, Bitcoin, and Ethereum accepted</li>
                  <li>• Secure verification process</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}