"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CreditCard,
  Zap,
  CheckCircle,
  Star,
  Shield,
  Clock,
  Users,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface CreditPackage {
  id: string
  credits: number
  price: number
  popular?: boolean
  bestValue?: boolean
  perCreditPrice: number
  savings?: string
  features: string[]
}

const creditPackages: CreditPackage[] = [
  {
    id: "starter",
    credits: 25,
    price: 19,
    perCreditPrice: 0.76,
    features: ["Perfect for testing 5 accounts", "Basic analysis reports", "Email support"],
  },
  {
    id: "popular",
    credits: 65,
    price: 39,
    popular: true,
    perCreditPrice: 0.6,
    savings: "Save $10",
    features: ["Test 13 accounts", "Detailed analytics", "Priority support", "Bulk testing features"],
  },
  {
    id: "pro",
    credits: 145,
    price: 69,
    bestValue: true,
    perCreditPrice: 0.48,
    savings: "Save $41",
    features: ["Test 29 accounts", "Advanced reporting", "Premium support", "API access", "Custom integrations"],
  },
  {
    id: "enterprise",
    credits: 350,
    price: 149,
    perCreditPrice: 0.43,
    savings: "Save $117",
    features: [
      "Test 70 accounts",
      "Enterprise analytics",
      "Dedicated support",
      "White-label options",
      "Custom development",
      "SLA guarantee",
    ],
  },
]

const faqs = [
  {
    question: "How do credits work?",
    answer:
      "Credits are used to perform account analyses and view historical results. New account analysis costs 5 credits, while viewing a previous result costs 1 credit. Credits never expire and can be used at any time.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept multiple payment methods: Venmo for quick mobile payments, Bitcoin (bc1qkq3wz5zmaxq384q05wavzcyzguc4rqm5ypyyku), and Ethereum (0x6FBe192da821d39d9D04d8089D6957F659885632). Contact us after payment with your transaction details.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Due to the digital nature of our credits and the immediate value provided, we don't offer refunds. However, if you experience any technical issues, our support team will work with you to resolve them.",
  },
  {
    question: "Do credits expire?",
    answer:
      "No, credits never expire! Once purchased, they remain in your account indefinitely until you use them for account analyses or viewing historical results.",
  },
  {
    question: "Can I share credits with other users?",
    answer:
      "Credits are tied to your individual account and cannot be transferred to other users. Each account maintains its own credit balance and usage history.",
  },
  {
    question: "What happens if I run out of credits?",
    answer:
      "If you run out of credits, you can purchase more at any time. Your account and all historical data remain intact - you just won't be able to perform new analyses until you add more credits.",
  },
  {
    question: "Is there a bulk discount for large purchases?",
    answer:
      "Yes! Our larger credit packages offer significant per-credit savings. The Enterprise package offers the best value at $0.43 per credit compared to $0.76 for the Starter package.",
  },
  {
    question: "How secure are my payments?",
    answer:
      "All payments are processed through Venmo's secure payment infrastructure. We never store your payment information and all transactions are encrypted and protected.",
  },
]

export default function CreditsPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const handlePurchase = (pkg: CreditPackage) => {
    const venmoUrl = `https://venmo.com/linelogic?txn=pay&amount=${pkg.price}&note=${encodeURIComponent(`LineLogic Credits - ${pkg.credits} credits`)}&audience=private`
    window.open(venmoUrl, "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-100 py-4 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/queue-testing" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Testing</span>
            </a>
            <div className="text-2xl font-bold text-gray-900">Credits & Pricing</div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Credit Package</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get the credits you need to analyze your Ticketmaster accounts and optimize your queue positions. All
            packages include the same powerful features.
          </p>
        </div>

        {/* Credit Usage Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            How Credits Work
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">New Account Analysis</h4>
                <p className="text-blue-700 text-sm">
                  Comprehensive queue testing and detailed analytics for any Ticketmaster account
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">View Historical Results</h4>
                <p className="text-blue-700 text-sm">Access previously analyzed accounts from your testing history</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${
                pkg.popular
                  ? "border-2 border-orange-300 shadow-lg"
                  : pkg.bestValue
                    ? "border-2 border-green-300 shadow-lg"
                    : "border border-gray-200"
              } hover:shadow-xl transition-shadow cursor-pointer`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-600 text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              {pkg.bestValue && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="text-3xl font-bold text-gray-900">{pkg.credits}</div>
                <div className="text-sm text-gray-600">Credits</div>
                <div className="text-2xl font-bold text-orange-600 mt-2">${pkg.price}</div>
                <div className="text-sm text-gray-500">${pkg.perCreditPrice.toFixed(2)} per credit</div>
                {pkg.savings && <div className="text-sm text-green-600 font-semibold">{pkg.savings}</div>}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full h-12 ${
                    pkg.popular || pkg.bestValue
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase Credits
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Payment with Venmo</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We use Venmo for fast, secure payments. Click any "Purchase Credits" button above to be redirected to
              Venmo with the payment details pre-filled.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure & Encrypted</h4>
              <p className="text-sm text-gray-600">
                All payments are processed through Venmo's secure infrastructure with bank-level encryption.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Processing</h4>
              <p className="text-sm text-gray-600">
                Credits are added to your account immediately after payment confirmation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Trusted by Thousands</h4>
              <p className="text-sm text-gray-600">
                Join thousands of users who trust LineLogic for their queue optimization needs.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                  </div>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 ml-8">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions about credits or pricing?</p>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}
