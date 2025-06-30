"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Mail,
  Search,
  CheckCircle,
  Zap,
  TrendingUp,
  Clock,
  Shield,
  Loader2,
  UserIcon,
  CreditCard,
  Plus,
  BarChart3,
  Activity,
  Server,
  Database,
  Eye,
  Lock,
  EyeOff,
  AlertCircle,
  Sparkles,
  History,
  Users,
  Syringe,
  Droplets,
  X,
} from "lucide-react"

import { auth, db, supabase } from "@/lib/supabase"
import { useSearchParams } from "next/navigation"

type AuthStep = "login" | "register" | "verify-email" | "authenticated"
type AnalysisStep = "idle" | "analyzing" | "complete" | "error"
type InjectionStep = "idle" | "evaluating" | "pricing" | "payment" | "processing" | "injecting" | "complete" | "error"

interface UserData {
  email: string
  name: string
  credits: number
  hashedEmail: string
  emailVerified: boolean
  registrationDate: string
}

interface DetailedAnalysisResult {
  // Basic Info
  currentPosition: number
  estimatedImprovement: number
  riskLevel: "low" | "medium" | "high"
  accountHealth: number
  recommendedAction: string
  creditsUsed: number
  email: string
  timestamp: string

  // Detailed Metrics
  accountAge: number
  totalEvents: number
  successRate: number
  averageWaitTime: number
  peakUsageHours: string[]
  deviceFingerprint: string
  ipReputation: number
  behaviorScore: number

  // Queue Analysis
  queuePatterns: {
    morningAvg: number
    afternoonAvg: number
    eveningAvg: number
    weekendAvg: number
  }

  // Competition Analysis
  competitorPositions: {
    similar_accounts: number
    better_positioned: number
    worse_positioned: number
  }

  // Technical Details
  connectionQuality: number
  serverLatency: number
  optimizationPotential: number

  // Historical Data
  positionHistory: Array<{
    date: string
    position: number
    event: string
  }>

  // Pricing factors
  complexityScore: number
  urgencyMultiplier: number
  personalizedPrice: number
}

interface EvaluationStep {
  title: string
  description: string
  progress: number
}

interface InjectionAccount {
  email: string
  selected: boolean
  price: number
  analysisResult: DetailedAnalysisResult
}

export default function QueueTestingPage() {
  // Auth state
  const [authStep, setAuthStep] = useState<AuthStep>("login")
  const [user, setUser] = useState<UserData | null>(null)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)

  // Analysis state
  const [email, setEmail] = useState("")
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>("idle")
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<DetailedAnalysisResult | null>(null)
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([])

  // Injection state
  const [injectionStep, setInjectionStep] = useState<InjectionStep>("idle")
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [evaluationSteps, setEvaluationSteps] = useState<EvaluationStep[]>([])
  const [currentEvaluationStep, setCurrentEvaluationStep] = useState(0)
  const [personalizedPrice, setPersonalizedPrice] = useState(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")

  // Multi-injection state
  const [injectionAccounts, setInjectionAccounts] = useState<InjectionAccount[]>([])
  const [totalInjectionPrice, setTotalInjectionPrice] = useState(0)
  const [injectionDiscount, setInjectionDiscount] = useState(0)

  // Payment confirmation state
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [selectedPaymentType, setSelectedPaymentType] = useState("")
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentService, setPaymentService] = useState("") // 'credits' or 'injection'
  const [receiptInput, setReceiptInput] = useState("")

  // Credits state
  const [showBuyCredits, setShowBuyCredits] = useState(false)
  const [selectedCreditPackage, setSelectedCreditPackage] = useState<{ price: number; credits: number } | null>(null)

  // History state
  const [showHistory, setShowHistory] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<DetailedAnalysisResult[]>([])

  // Add state for bulk testing
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkEmails, setBulkEmails] = useState("")
  const [bulkResults, setBulkResults] = useState<DetailedAnalysisResult[]>([])

  // Enhanced hash function for consistent results
  const hashEmail = (email: string): string => {
    let hash = 0
    const normalizedEmail = email.toLowerCase().trim()
    for (let i = 0; i < normalizedEmail.length; i++) {
      const char = normalizedEmail.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString()
  }

  // Check if email already exists
  const emailExists = (email: string): boolean => {
    const hashedEmail = hashEmail(email)
    return localStorage.getItem(`user_${hashedEmail}`) !== null
  }

  // Generate verification code
  const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Simulate email sending
  const sendVerificationEmail = async (email: string, code: string): Promise<void> => {
    // In a real app, this would send an actual email
    console.log(`Verification code for ${email}: ${code}`)
    // Store the code temporarily
    localStorage.setItem(`verification_${hashEmail(email)}`, code)
  }

  // Generate consistent analysis results based on email hash
  const generateAnalysisResult = (email: string): DetailedAnalysisResult => {
    const hash = Number.parseInt(hashEmail(email))
    const seed = hash % 1000000

    // Use hash to generate consistent "random" values
    const random = (min: number, max: number, offset = 0) => {
      const value = ((seed + offset) * 9301 + 49297) % 233280
      return min + (value / 233280) * (max - min)
    }

    const currentPos = Math.floor(random(5000, 95000, 1))
    const improvement = Math.floor(random(currentPos * 0.7, currentPos * 0.95, 2))
    const complexityScore = Math.floor(random(1, 10, 26))
    const urgencyMultiplier = random(0.8, 1.3, 27)

    // Calculate personalized price based on analysis factors - centered around $120
    const basePrice = 120
    const complexityAdjustment = (complexityScore - 5) * 8 // -32 to +40
    const urgencyAdjustment = basePrice * (urgencyMultiplier - 1) // -24 to +36
    const personalizedPrice = Math.round(basePrice + complexityAdjustment + urgencyAdjustment)

    return {
      currentPosition: currentPos,
      estimatedImprovement: improvement,
      riskLevel: random(0, 100, 3) > 70 ? "high" : random(0, 100, 4) > 40 ? "medium" : "low",
      accountHealth: Math.floor(random(65, 98, 5)),
      recommendedAction: "Queue injection recommended for optimal positioning",
      creditsUsed: 5,
      email: email,
      timestamp: new Date().toISOString(),

      accountAge: Math.floor(random(30, 1200, 6)),
      totalEvents: Math.floor(random(15, 250, 7)),
      successRate: Math.floor(random(45, 89, 8)),
      averageWaitTime: Math.floor(random(180, 3600, 9)),
      peakUsageHours: ["7-9 PM", "12-2 PM", "10-11 AM"],
      deviceFingerprint: `FP-${hash.toString(16).substring(0, 8).toUpperCase()}`,
      ipReputation: Math.floor(random(70, 95, 10)),
      behaviorScore: Math.floor(random(75, 95, 11)),

      queuePatterns: {
        morningAvg: Math.floor(random(15000, 45000, 12)),
        afternoonAvg: Math.floor(random(25000, 55000, 13)),
        eveningAvg: Math.floor(random(35000, 75000, 14)),
        weekendAvg: Math.floor(random(20000, 50000, 15)),
      },

      competitorPositions: {
        similar_accounts: Math.floor(random(1200, 3500, 16)),
        better_positioned: Math.floor(random(200, 800, 17)),
        worse_positioned: Math.floor(random(2000, 5000, 18)),
      },

      connectionQuality: Math.floor(random(80, 98, 19)),
      serverLatency: Math.floor(random(15, 85, 20)),
      optimizationPotential: Math.floor(random(70, 95, 21)),

      positionHistory: [
        { date: "2024-01-15", position: Math.floor(random(20000, 60000, 22)), event: "Taylor Swift - Eras Tour" },
        { date: "2024-01-08", position: Math.floor(random(15000, 45000, 23)), event: "Bad Bunny - World Tour" },
        { date: "2023-12-20", position: Math.floor(random(25000, 65000, 24)), event: "Beyoncé - Renaissance" },
        { date: "2023-12-10", position: Math.floor(random(18000, 50000, 25)), event: "Drake - It's All A Blur" },
      ],

      complexityScore,
      urgencyMultiplier,
      personalizedPrice,
    }
  }

  // Save analysis result to history
  const saveAnalysisToHistory = (result: DetailedAnalysisResult) => {
    if (!user) return

    const historyKey = `analysis_history_${user.hashedEmail}`
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || "[]")

    // Check if this email already has a result
    const existingIndex = existingHistory.findIndex((r: DetailedAnalysisResult) => r.email === result.email)

    if (existingIndex >= 0) {
      // Update existing result
      existingHistory[existingIndex] = result
    } else {
      // Add new result
      existingHistory.unshift(result)
    }

    // Keep only last 50 results
    const trimmedHistory = existingHistory.slice(0, 50)
    localStorage.setItem(historyKey, JSON.stringify(trimmedHistory))
    setAnalysisHistory(trimmedHistory)
  }

  // Load analysis history
  const loadAnalysisHistory = () => {
    if (!user) return

    const historyKey = `analysis_history_${user.hashedEmail}`
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]")
    setAnalysisHistory(history)
  }

  // Calculate bulk injection discount
  const calculateInjectionDiscount = (accountCount: number): number => {
    if (accountCount >= 10) return 0.25 // 25% off for 10+
    if (accountCount >= 5) return 0.15 // 15% off for 5+
    if (accountCount >= 3) return 0.1 // 10% off for 3+
    return 0
  }

  useEffect(() => {
    // Clear only our fake user data, not Supabase session data
    localStorage.removeItem("currentUser")
    // Clear any user-specific localStorage data from our old fake auth system
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("user_")) {
        localStorage.removeItem(key)
      }
    })
    // Keep Supabase auth session data intact (keys starting with 'sb-')
    
    // Check for existing session on page load
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('🔒 Initial session check:', session?.user?.email || 'No session')
      if (error) {
        console.error('❌ Session error:', error)
      }
    }
    checkSession()
  }, [])

  useEffect(() => {
    if (user) {
      loadAnalysisHistory()
    }
  }, [user])

  const searchParams = useSearchParams()

  useEffect(() => {
    // Check URL parameters for signup mode
    const mode = searchParams.get("mode")
    if (mode === "signup" && authStep === "login") {
      setAuthStep("register")
    }
  }, [searchParams, authStep])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError("")

    // ✅ Ensure values are strings
    const payload = {
      email: String(loginEmail).trim(),
      password: String(loginPassword),
    }

    // 🔍 Debug logging
    console.log("Login payload:", JSON.stringify(payload))

    // ✅ Type validation
    if (typeof payload.email !== "string" || !payload.email) {
      setAuthError("Email must be a valid string")
      setAuthLoading(false)
      return
    }

    if (typeof payload.password !== "string" || !payload.password) {
      setAuthError("Password is required")
      setAuthLoading(false)
      return
    }

    try {
      const { data, error } = await auth.signIn(payload.email, payload.password)

      if (error) {
        console.error("Supabase login error:", error)
        setAuthError(error.message)
      } else {
        console.log("Login successful:", data)
        // Force auth step to authenticated if login succeeds
        if (data?.user) {
          setAuthStep("authenticated")
        }
      }
    } catch (error) {
      console.error("Unexpected login error:", error)
      setAuthError("Login failed. Please try again.")
    }

    setAuthLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError("")

    // 🔍 Debug logging - let's see what we're actually sending
    console.log("Form values:", {
      email: registerEmail,
      password: registerPassword,
      name: registerName,
    })

    // ✅ Ensure all values are strings, not objects
    const payload = {
      email: String(registerEmail).trim(),
      password: String(registerPassword),
      name: String(registerName).trim(),
    }

    // 🔍 Log the actual payload being sent
    console.log("Payload being sent to Supabase:", JSON.stringify(payload))

    // ✅ Type validation before submission
    if (typeof payload.email !== "string" || !payload.email) {
      setAuthError("Email must be a valid string")
      setAuthLoading(false)
      return
    }

    if (typeof payload.password !== "string" || payload.password.length < 6) {
      setAuthError("Password must be at least 6 characters")
      setAuthLoading(false)
      return
    }

    if (typeof payload.name !== "string" || !payload.name) {
      setAuthError("Name must be a valid string")
      setAuthLoading(false)
      return
    }

    try {
      const { data, error } = await auth.signUp(payload.email, payload.password, payload.name)

      if (error) {
        console.error("Supabase signup error:", error)
        setAuthError(error.message)
      } else {
        console.log("Signup successful:", data)
        setAuthStep("verify-email")
      }
    } catch (error) {
      console.error("Unexpected signup error:", error)
      setAuthError("Registration failed. Please try again.")
    }

    setAuthLoading(false)
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError("")

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const hashedEmail = hashEmail(registerEmail)
      const storedCode = localStorage.getItem(`verification_${hashedEmail}`)

      if (verificationCode !== storedCode) {
        setAuthError("Invalid verification code. Please try again.")
        setAuthLoading(false)
        return
      }

      // Update user as verified
      const userData = JSON.parse(localStorage.getItem(`user_${hashedEmail}`) || "{}")
      userData.emailVerified = true

      localStorage.setItem(`user_${hashedEmail}`, JSON.stringify(userData))
      localStorage.setItem("currentUser", JSON.stringify(userData))
      localStorage.removeItem(`verification_${hashedEmail}`)

      setUser(userData)
      setEmail(userData.email)
      setAuthStep("authenticated")
    } catch (error) {
      setAuthError("Verification failed. Please try again.")
    }

    setAuthLoading(false)
  }

  const resendVerificationCode = async () => {
    const verificationCode = generateVerificationCode()
    await sendVerificationEmail(registerEmail, verificationCode)
    // Show success message (in a real app)
    console.log("Verification code resent")
  }

  const updateUserCredits = async (newCredits: number) => {
    if (!user) return

    console.log(`🔥 CREDIT UPDATE: ${user.credits} → ${newCredits}`)

    // Update user state
    const updatedUser = { ...user, credits: newCredits }
    setUser(updatedUser)
    
    // Update database - this is the source of truth, not localStorage
    try {
      const result = await db.updateUserCredits(user.hashedEmail, newCredits)
      console.log(`✅ Database update result:`, result)
    } catch (error) {
      console.error("❌ Failed to update credits in database:", error)
      // Revert user state if database update fails
      setUser(user)
    }
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !user || user.credits < 5) return

    setAnalysisStep("analyzing")
    setAnalysisProgress(0)
    setAnalysisSteps([])

    const steps = [
      "Establishing secure connection to TM servers...",
      "Authenticating account credentials...",
      "Scanning historical queue data...",
      "Analyzing behavioral patterns...",
      "Evaluating device fingerprint...",
      "Assessing IP reputation score...",
      "Calculating queue optimization metrics...",
      "Comparing with competitor accounts...",
      "Generating improvement strategy...",
      "Compiling comprehensive analysis report...",
    ]

    // Simulate detailed analysis process
    for (let i = 0; i < steps.length; i++) {
      setAnalysisSteps((prev) => [...prev, steps[i]])
      setAnalysisProgress(((i + 1) / steps.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, 600))
    }

    const result = generateAnalysisResult(email)
    setAnalysisResult(result)
    saveAnalysisToHistory(result)
    await updateUserCredits(user.credits - 5)
    setAnalysisStep("complete")
  }

  const handleBulkAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkEmails || !user) return

    const emails = bulkEmails
      .split("\n")
      .filter((email) => email.trim())
      .map((email) => email.trim())
    const totalCost = emails.length * 5

    if (user.credits < totalCost) {
      alert(`Insufficient credits. You need ${totalCost} credits but only have ${user.credits}.`)
      return
    }

    setAnalysisStep("analyzing")
    setAnalysisProgress(0)
    setAnalysisSteps([])
    setBulkResults([])

    const steps = [
      "Establishing secure connections to TM servers...",
      "Authenticating multiple account credentials...",
      "Scanning historical queue data for all accounts...",
      "Analyzing behavioral patterns across accounts...",
      "Evaluating device fingerprints...",
      "Assessing IP reputation scores...",
      "Calculating queue optimization metrics...",
      "Comparing with competitor accounts...",
      "Generating improvement strategies...",
      "Compiling comprehensive analysis reports...",
    ]

    // Simulate detailed analysis process
    for (let i = 0; i < steps.length; i++) {
      setAnalysisSteps((prev) => [...prev, steps[i]])
      setAnalysisProgress(((i + 1) / steps.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    // Generate results for all emails
    const results = emails.map((email) => generateAnalysisResult(email))
    setBulkResults(results)

    // Save all results to history
    results.forEach((result) => saveAnalysisToHistory(result))

    await updateUserCredits(user.credits - totalCost)
    setAnalysisStep("complete")
  }

  const handleStartEvaluation = async () => {
    if (!analysisResult) return

    setInjectionStep("evaluating")
    setEvaluationProgress(0)
    setCurrentEvaluationStep(0)

    const evaluationSteps: EvaluationStep[] = [
      {
        title: "Account Complexity Analysis",
        description: "Evaluating account structure and optimization requirements",
        progress: 0,
      },
      {
        title: "Risk Assessment",
        description: "Calculating injection safety parameters and success probability",
        progress: 0,
      },
      {
        title: "Market Positioning",
        description: "Analyzing current market conditions and competitor landscape",
        progress: 0,
      },
      {
        title: "Resource Allocation",
        description: "Determining optimal server resources and processing power needed",
        progress: 0,
      },
      {
        title: "Price Calculation",
        description: "Computing personalized pricing based on complexity and urgency",
        progress: 0,
      },
    ]

    setEvaluationSteps(evaluationSteps)

    // Simulate 15-second evaluation process
    for (let i = 0; i < evaluationSteps.length; i++) {
      setCurrentEvaluationStep(i)

      // Animate progress for current step
      for (let progress = 0; progress <= 100; progress += 5) {
        setEvaluationSteps((prev) => prev.map((step, index) => (index === i ? { ...step, progress } : step)))
        setEvaluationProgress(((i * 100 + progress) / (evaluationSteps.length * 100)) * 100)
        await new Promise((resolve) => setTimeout(resolve, 60)) // 3 seconds per step
      }
    }

    setPersonalizedPrice(analysisResult.personalizedPrice)
    setInjectionStep("pricing")
  }

  const handleStartMultiInjection = () => {
    if (bulkResults.length === 0) return

    const accounts: InjectionAccount[] = bulkResults.map((result) => ({
      email: result.email,
      selected: false,
      price: result.personalizedPrice,
      analysisResult: result,
    }))

    setInjectionAccounts(accounts)
    setInjectionStep("pricing")
  }

  const toggleAccountSelection = (email: string) => {
    setInjectionAccounts((prev) => {
      const updated = prev.map((account) =>
        account.email === email ? { ...account, selected: !account.selected } : account,
      )

      const selectedAccounts = updated.filter((account) => account.selected)
      const subtotal = selectedAccounts.reduce((sum, account) => sum + account.price, 0)
      const discount = calculateInjectionDiscount(selectedAccounts.length)
      const discountAmount = subtotal * discount

      setTotalInjectionPrice(subtotal - discountAmount)
      setInjectionDiscount(discount)

      return updated
    })
  }

  const handlePayment = async (method: string, service: string = "injection", amount: number = 0) => {
    setSelectedPaymentType(method)
    setPaymentService(service)
    setPaymentAmount(amount || (service === "credits" ? selectedCreditPackage?.price || 0 : totalInjectionPrice || personalizedPrice))
    setShowPaymentConfirm(true)
  }

  const handleReceiptSubmit = async () => {
    if (!receiptInput.trim()) {
      alert("Please enter your transaction ID or receipt number")
      return
    }

    // Here you would normally send the receipt info to your backend
    console.log("Receipt submitted:", {
      paymentType: selectedPaymentType,
      service: paymentService,
      amount: paymentAmount,
      receipt: receiptInput
    })

    // Save payment receipt for staff verification
    if (user) {
      try {
        await db.savePaymentReceipt(user.hashedEmail, {
          paymentType: selectedPaymentType,
          serviceType: paymentService,
          amount: paymentAmount,
          receiptId: receiptInput
        })
      } catch (error) {
        console.error("Failed to save payment receipt:", error)
      }
    }

    // Show different confirmation messages based on payment type
    let confirmationMessage = ""
    
    if (selectedPaymentType === "venmo") {
      confirmationMessage = "Payment receipt submitted! Credits will be added to your account upon verification by our team (usually within 1-2 business hours)."
    } else if (selectedPaymentType === "bitcoin") {
      confirmationMessage = "Bitcoin transaction submitted! Credits will be automatically added to your account after 1 confirmation (typically 10-60 minutes)."
    } else if (selectedPaymentType === "ethereum") {
      confirmationMessage = "Ethereum transaction submitted! Credits will be automatically added to your account after 55 confirmations (typically 10-15 minutes)."
    }

    // Simulate processing
    if (paymentService === "credits") {
      alert(confirmationMessage)
      setShowBuyCredits(false)
    } else {
      // Continue with injection flow
      alert(confirmationMessage + " Your injection service will proceed once payment is confirmed.")
      setSelectedPaymentMethod(selectedPaymentType)
      setInjectionStep("processing")
      
      // Save injection record to database
      if (user) {
        try {
          const selectedAccounts = injectionAccounts.filter(a => a.selected)
          await db.saveInjectionRecord(user.hashedEmail, {
            accounts: selectedAccounts,
            totalPrice: paymentAmount,
            paymentMethod: selectedPaymentType
          })
          console.log("Injection record saved successfully")
        } catch (error) {
          console.error("Failed to save injection record:", error)
        }
      }
      
      // Simulate payment processing (2-3 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2500))
      
      setInjectionStep("injecting")
      
      // Simulate injection process with realistic timing (15-30 seconds)
      await new Promise((resolve) => setTimeout(resolve, 20000))
      
      // Mark injection as complete and save completion status
      if (user) {
        try {
          // Here you would normally call your actual injection API
          // For now, we'll just simulate successful injection
          console.log("Injection completed for accounts:", injectionAccounts.filter(a => a.selected).map(a => a.email))
        } catch (error) {
          console.error("Injection completion error:", error)
        }
      }
      
      setInjectionStep("complete")
    }

    // Reset payment confirmation state
    setShowPaymentConfirm(false)
    setReceiptInput("")
  }

  const handleBuyCredits = (amount: number, price: number) => {
    if (!user) return
    setSelectedCreditPackage({ credits: amount, price })
    // Show payment options instead of immediately adding credits
  }

  const handleViewHistoryResult = async (result: DetailedAnalysisResult) => {
    if (!user || user.credits < 1) {
      alert("You need 1 credit to view historical results.")
      return
    }

    setAnalysisResult(result)
    await updateUserCredits(user.credits - 1)
    setShowHistory(false)
    setAnalysisStep("complete")
  }

  const handleLogout = async () => {
    await auth.signOut()
    setUser(null)
    setAuthStep("login")
    setEmail("")
    setAnalysisResult(null)
    setAnalysisStep("idle")
    setInjectionStep("idle")
    setBulkResults([])
    setInjectionAccounts([])
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  useEffect(() => {
    console.log("🔧 Setting up auth state listener...")
    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (event, session) => {
      console.log(`🔄 Auth event: ${event}`, session?.user?.email || 'no user')
      
      if (session?.user) {
        console.log(`🔍 Loading user profile for:`, session.user.email)
        const { data: profile } = await db.getUserProfile(session.user.id)
        if (profile) {
          console.log(`📊 Loaded profile with ${profile.credits} credits`)
          setUser({
            email: profile.email,
            name: profile.name,
            credits: profile.credits,
            hashedEmail: profile.id,
            emailVerified: profile.email_verified,
            registrationDate: profile.created_at,
          })
          setAuthStep("authenticated")
        } else {
          console.log("❌ No profile found for user")
          setAuthStep("login")
        }
      } else {
        console.log("👤 No session, setting to login")
        setUser(null)
        setAuthStep("login")
      }
    })

    return () => {
      console.log("🧹 Cleaning up auth listener")
      subscription.unsubscribe()
    }
  }, [])

  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError("")

    try {
      const { error } = await auth.resetPassword({
        email: resetEmail,
        redirectTo: window.location.origin,
      })
      if (error) {
        setAuthError(error.message)
      } else {
        setAuthError("")
        alert("Password reset email sent! Check your inbox.")
        setShowForgotPassword(false)
      }
    } catch (err) {
      setAuthError("Failed to send reset email. Please try again.")
    }

    setAuthLoading(false)
  }

  // Authentication UI
  if (authStep !== "authenticated") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="border-b border-gray-100 py-4 bg-white">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </a>
              <div className="text-2xl font-bold text-gray-900">Queue Testing</div>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center py-12 px-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Access Required</h1>
              <p className="text-gray-600">
                {authStep === "login" && "Sign in to access advanced queue testing"}
                {authStep === "register" && "Create your account to get started"}
                {authStep === "verify-email" && "Verify your email to complete registration"}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  {authStep === "login" && "Sign In"}
                  {authStep === "register" && "Create Account"}
                  {authStep === "verify-email" && "Email Verification"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {authError && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">{authError}</AlertDescription>
                  </Alert>
                )}

                {authStep === "login" && (
                  <div className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10 h-12"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10 h-12"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
                        disabled={authLoading}
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>

                    {!showForgotPassword ? (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="Enter your email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="h-12"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                          disabled={authLoading}
                        >
                          {authLoading ? "Sending..." : "Send Reset Email"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowForgotPassword(false)}
                          className="w-full"
                        >
                          Back to Login
                        </Button>
                      </form>
                    )}

                    <div className="text-center">
                      <button
                        onClick={() => setAuthStep("register")}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Don't have an account? Register here
                      </button>
                    </div>
                  </div>
                )}

                {authStep === "register" && (
                  <div className="space-y-4">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="register-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            className="pl-10 h-12"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="Enter your email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            className="pl-10 h-12"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          One account per email address. Email verification required.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="register-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className="pl-10 pr-10 h-12"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700 font-medium">🎉 New User Bonus</p>
                        <p className="text-xs text-green-600">
                          Get 10 free analysis credits when you verify your email!
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
                        disabled={authLoading}
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>

                    <div className="text-center">
                      <button
                        onClick={() => setAuthStep("login")}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Already have an account? Sign in here
                      </button>
                    </div>
                  </div>
                )}

                {authStep === "verify-email" && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        We've sent a verification code to <strong>{registerEmail}</strong>
                      </p>
                    </div>

                    <form onSubmit={handleVerifyEmail} className="space-y-4">
                      <div>
                        <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
                          Verification Code
                        </label>
                        <Input
                          id="verification-code"
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="h-12 text-center text-lg font-mono"
                          maxLength={6}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
                        disabled={authLoading}
                      >
                        {authLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Email"
                        )}
                      </Button>
                    </form>

                    <div className="text-center">
                      <button onClick={resendVerificationCode} className="text-sm text-blue-600 hover:text-blue-700">
                        Didn't receive the code? Resend
                      </button>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700">
                        Check your spam folder if you don't see the email. The verification code expires in 10 minutes.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center mt-6 text-sm text-gray-600">
              <p>By creating an account, you agree to our Terms of Service and Privacy Policy</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main authenticated UI
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </a>
            <div className="text-2xl font-bold text-gray-900">Queue Testing</div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              <Zap className="w-3 h-3 mr-1" />
              {user.credits} Credits
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <History className="w-4 h-4 mr-1" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBuyCredits(true)}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Buy Credits
            </Button>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <UserIcon className="h-4 w-4 text-gray-400" />
              </div>
              <span className="text-sm text-gray-700">{user.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Advanced Queue Analysis</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Deep dive into your TM account performance with comprehensive analytics and personalized optimization.
          </p>
        </div>

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5 text-blue-600" />
                    <span>Analysis History</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[60vh]">
                {analysisHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No analysis history found.</p>
                    <p className="text-sm text-gray-500 mt-2">Run some account analyses to see them here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysisHistory.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">{result.email}</div>
                            <div className="text-sm text-gray-600">
                              Position: #{result.currentPosition.toLocaleString()} • Health: {result.accountHealth}% •
                              {new Date(result.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getRiskColor(result.riskLevel)} capitalize`}>
                              {result.riskLevel} Risk
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleViewHistoryResult(result)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={user.credits < 1}
                            >
                              View (1 Credit)
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Buy Credits Modal */}
        {showBuyCredits && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span>Purchase Credits</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowBuyCredits(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Credit Usage</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>
                      • New account analysis: <strong>5 credits</strong>
                    </div>
                    <div>
                      • View history result: <strong>1 credit</strong>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div
                    className="border rounded-lg p-4 hover:border-orange-300 cursor-pointer"
                    onClick={() => handleBuyCredits(25, 19)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">25 Credits</div>
                        <div className="text-sm text-gray-600">$0.76 per credit</div>
                      </div>
                      <div className="text-lg font-bold text-orange-600">$19</div>
                    </div>
                  </div>

                  <div
                    className="border-2 border-orange-300 bg-orange-50 rounded-lg p-4 hover:border-orange-400 cursor-pointer"
                    onClick={() => handleBuyCredits(65, 39)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">65 Credits</div>
                        <div className="text-sm text-orange-600">$0.60 per credit • Most Popular</div>
                      </div>
                      <div className="text-lg font-bold text-orange-600">$39</div>
                    </div>
                  </div>

                  <div
                    className="border rounded-lg p-4 hover:border-orange-300 cursor-pointer"
                    onClick={() => handleBuyCredits(145, 69)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">145 Credits</div>
                        <div className="text-sm text-gray-600">$0.48 per credit • Best Value</div>
                      </div>
                      <div className="text-lg font-bold text-orange-600">$69</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-4 text-center">Choose Payment Method</h4>
                  
                  {/* Venmo Payment */}
                  <button
                    onClick={() => {
                      window.open(`https://venmo.com/linelogic?txn=pay&amount=${selectedCreditPackage?.price || 19}&note=${encodeURIComponent("LineLogic Credits Purchase")}&audience=private`, '_blank');
                      handlePayment("venmo", "credits");
                    }}
                    className="flex items-center justify-center space-x-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full mb-3"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.135 5.938c1.047-1.047 2.719-1.047 3.766 0 1.047 1.047 1.047 2.719 0 3.766L12.766 13.84c-1.047 1.047-2.719 1.047-3.766 0-1.047-1.047-1.047-2.719 0-3.766l4.135-4.136z" />
                      <path d="M7.5 18.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5 2.5-1.119 2.5-2.5 2.5z" />
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold">Pay ${selectedCreditPackage?.price || 19} with Venmo</div>
                      <div className="text-sm text-blue-100">Quick & secure payment</div>
                    </div>
                  </button>

                  {/* Bitcoin Payment */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('bc1qkq3wz5zmaxq384q05wavzcyzguc4rqm5ypyyku');
                      alert('Bitcoin address copied! Send payment and contact us with transaction details.');
                      handlePayment("bitcoin", "credits");
                    }}
                    className="flex items-center justify-center space-x-3 p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors w-full mb-3"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.28 11.408c-.177-.36-.453-.648-.8-.833.328-.165.576-.417.714-.728.143-.32.166-.668.067-.994-.203-.665-.745-1.074-1.407-1.074-.662 0-1.204.409-1.407 1.074-.099.326-.076.674.067.994.138.311.386.563.714.728-.347.185-.623.473-.8.833-.203.416-.203.895 0 1.311.203.416.553.728.998.728s.795-.312.998-.728c.203-.416.203-.895 0-1.311z"/>
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold">Pay ${selectedCreditPackage?.price || 19} with Bitcoin</div>
                      <div className="text-sm text-orange-100">Click to copy address</div>
                    </div>
                  </button>

                  {/* Ethereum Payment */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('0x6FBe192da821d39d9D04d8089D6957F659885632');
                      alert('Ethereum address copied! Send payment and contact us with transaction details.');
                      handlePayment("ethereum", "credits");
                    }}
                    className="flex items-center justify-center space-x-3 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors w-full"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                    </svg>
                    <div className="text-left">
                      <div className="font-semibold">Pay ${selectedCreditPackage?.price || 19} with Ethereum</div>
                      <div className="text-sm text-purple-100">Click to copy address</div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis Form */}
        {analysisStep === "idle" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>Comprehensive Account Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center space-x-4 mb-4">
                  <Button
                    type="button"
                    variant={!isBulkMode ? "default" : "outline"}
                    onClick={() => setIsBulkMode(false)}
                    className={!isBulkMode ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    Single Account
                  </Button>
                  <Button
                    type="button"
                    variant={isBulkMode ? "default" : "outline"}
                    onClick={() => setIsBulkMode(true)}
                    className={isBulkMode ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    Bulk Testing
                  </Button>
                </div>

                {!isBulkMode ? (
                  <form onSubmit={handleAnalyze} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        TM Account Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your Ticketmaster email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 text-lg"
                        required
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Comprehensive Analysis Cost</span>
                        <span className="text-sm font-bold text-orange-600">5 Credits</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Your Credits</span>
                        <span className="text-sm font-bold text-gray-900">{user.credits} remaining</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
                      disabled={!email || user.credits < 5}
                    >
                      <Search className="mr-2 h-5 w-5" />
                      Run Deep Analysis ({user.credits >= 5 ? "5 Credits" : "Insufficient Credits"})
                    </Button>

                    {user.credits < 5 && (
                      <div className="text-center">
                        <p className="text-red-600 mb-2">Insufficient credits (need 5, have {user.credits})</p>
                        <Button
                          variant="outline"
                          className="text-orange-600 border-orange-600 hover:bg-orange-50 bg-transparent"
                          onClick={() => setShowBuyCredits(true)}
                        >
                          Purchase More Credits
                        </Button>
                      </div>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleBulkAnalyze} className="space-y-6">
                    <div>
                      <label htmlFor="bulk-emails" className="block text-sm font-medium text-gray-700 mb-2">
                        TM Account Emails (One per line)
                      </label>
                      <textarea
                        id="bulk-emails"
                        placeholder="Enter multiple Ticketmaster emails, one per line:&#10;user1@example.com&#10;user2@example.com&#10;user3@example.com"
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Bulk testing processes multiple accounts simultaneously. Each account costs 5 credits.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Total Cost</span>
                        <span className="text-sm font-bold text-orange-600">
                          {bulkEmails.split("\n").filter((email) => email.trim()).length * 5} Credits
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Your Credits</span>
                        <span className="text-sm font-bold text-gray-900">{user.credits} remaining</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12"
                      disabled={
                        !bulkEmails || user.credits < bulkEmails.split("\n").filter((email) => email.trim()).length * 5
                      }
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Run Bulk Analysis
                    </Button>

                    {user.credits < bulkEmails.split("\n").filter((email) => email.trim()).length * 5 && bulkEmails && (
                      <div className="text-center">
                        <p className="text-red-600 mb-2">
                          Insufficient credits (need {bulkEmails.split("\n").filter((email) => email.trim()).length * 5}
                          , have {user.credits})
                        </p>
                        <Button
                          variant="outline"
                          className="text-orange-600 border-orange-600 hover:bg-orange-50 bg-transparent"
                          onClick={() => setShowBuyCredits(true)}
                        >
                          Purchase More Credits
                        </Button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Progress */}
        {analysisStep === "analyzing" && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
                <span>{isBulkMode ? "Bulk Analysis in Progress" : "Deep Analysis in Progress"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
                  <span className="text-sm text-gray-600">{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="h-3" />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analysisSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Analyzing:</strong>{" "}
                  {isBulkMode ? `${bulkEmails.split("\n").filter((email) => email.trim()).length} accounts` : email}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {isBulkMode
                    ? "Bulk analysis typically takes 90-120 seconds"
                    : "Comprehensive analysis typically takes 60-90 seconds"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Results */}
        {analysisStep === "complete" && bulkResults.length > 0 && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Bulk Analysis Complete - {bulkResults.length} Accounts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 mb-6">
                  {bulkResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{result.email}</div>
                          <div className="text-sm text-gray-600">
                            Position: #{result.currentPosition.toLocaleString()} • Health: {result.accountHealth}% •
                            Improvement: +{result.estimatedImprovement.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getRiskColor(result.riskLevel)} capitalize`}>
                            {result.riskLevel} Risk
                          </Badge>
                          <div className="text-lg font-bold text-orange-600">${result.personalizedPrice}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Button
                    onClick={handleStartMultiInjection}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-4"
                  >
                    <Syringe className="mr-2 h-5 w-5" />
                    Setup Multi-Account Injection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Single Analysis Results */}
        {analysisStep === "complete" && analysisResult && bulkResults.length === 0 && (
          <div className="space-y-8">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Analysis Complete - Comprehensive Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="patterns">Queue Patterns</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="competition">Competition</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Current Queue Position</label>
                          <div className="text-3xl font-bold text-gray-900">
                            #{analysisResult.currentPosition.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Estimated Improvement</label>
                          <div className="text-3xl font-bold text-green-600">
                            +{analysisResult.estimatedImprovement.toLocaleString()}
                          </div>
                          <p className="text-sm text-gray-600">positions forward</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Account Health Score</label>
                          <div className="flex items-center space-x-2">
                            <div className="text-2xl font-bold text-gray-900">{analysisResult.accountHealth}%</div>
                            <div className="flex-1">
                              <Progress value={analysisResult.accountHealth} className="h-2" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Risk Assessment</label>
                          <Badge className={`${getRiskColor(analysisResult.riskLevel)} capitalize`}>
                            {analysisResult.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Account Age</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">{analysisResult.accountAge} days</div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Success Rate</span>
                        </div>
                        <div className="text-lg font-bold text-green-600">{analysisResult.successRate}%</div>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Total Events</span>
                        </div>
                        <div className="text-lg font-bold text-purple-600">{analysisResult.totalEvents}</div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-900">Behavior Score</span>
                        </div>
                        <div className="text-lg font-bold text-orange-600">{analysisResult.behaviorScore}/100</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="patterns" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Queue Position Patterns</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Morning (6AM-12PM)</span>
                            <span className="font-semibold">
                              #{analysisResult.queuePatterns.morningAvg.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Afternoon (12PM-6PM)</span>
                            <span className="font-semibold">
                              #{analysisResult.queuePatterns.afternoonAvg.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Evening (6PM-12AM)</span>
                            <span className="font-semibold">
                              #{analysisResult.queuePatterns.eveningAvg.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Weekend Average</span>
                            <span className="font-semibold">
                              #{analysisResult.queuePatterns.weekendAvg.toLocaleString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Peak Usage Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Optimal Queue Times</label>
                            <div className="space-y-2 mt-2">
                              {analysisResult.peakUsageHours.map((time, index) => (
                                <Badge key={index} variant="outline" className="mr-2">
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Average Wait Time</label>
                            <div className="text-lg font-bold text-gray-900">
                              {Math.floor(analysisResult.averageWaitTime / 60)} min{" "}
                              {analysisResult.averageWaitTime % 60} sec
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <Server className="h-4 w-4" />
                            <span>Technical Metrics</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Connection Quality</span>
                              <span className="text-sm font-semibold">{analysisResult.connectionQuality}%</span>
                            </div>
                            <Progress value={analysisResult.connectionQuality} className="h-2" />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Server Latency</span>
                              <span className="text-sm font-semibold">{analysisResult.serverLatency}ms</span>
                            </div>
                            <Progress value={100 - analysisResult.serverLatency} className="h-2" />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">IP Reputation</span>
                              <span className="text-sm font-semibold">{analysisResult.ipReputation}%</span>
                            </div>
                            <Progress value={analysisResult.ipReputation} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <Database className="h-4 w-4" />
                            <span>Device & Security</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Device Fingerprint</label>
                            <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                              {analysisResult.deviceFingerprint}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-500">Optimization Potential</label>
                            <div className="flex items-center space-x-2">
                              <div className="text-lg font-bold text-green-600">
                                {analysisResult.optimizationPotential}%
                              </div>
                              <Progress value={analysisResult.optimizationPotential} className="flex-1 h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="competition" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Competitive Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 mb-2">
                              {analysisResult.competitorPositions.similar_accounts.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-700">Similar Accounts</div>
                            <div className="text-xs text-blue-600 mt-1">Same behavior pattern</div>
                          </div>

                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 mb-2">
                              {analysisResult.competitorPositions.better_positioned.toLocaleString()}
                            </div>
                            <div className="text-sm text-green-700">Better Positioned</div>
                            <div className="text-xs text-green-600 mt-1">Ahead of you</div>
                          </div>

                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 mb-2">
                              {analysisResult.competitorPositions.worse_positioned.toLocaleString()}
                            </div>
                            <div className="text-sm text-red-700">Worse Positioned</div>
                            <div className="text-xs text-red-600 mt-1">Behind you</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Queue History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysisResult.positionHistory.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-semibold text-gray-900">{entry.event}</div>
                                <div className="text-sm text-gray-600">{entry.date}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  #{entry.position.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">Queue position</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Injection CTA */}
            {injectionStep === "idle" && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <Sparkles className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready for Account Injection?</h3>
                    <p className="text-gray-700 max-w-2xl mx-auto">
                      Based on your comprehensive analysis, we can optimize your queue position and move you up{" "}
                      <strong>{analysisResult.estimatedImprovement.toLocaleString()} positions</strong> using advanced
                      algorithms.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg mb-6 max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Account Injection</span>
                      <span className="text-2xl font-bold text-orange-600">Starting at $120</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>✓ Personalized pricing based on complexity</div>
                      <div>✓ Advanced position optimization</div>
                      <div>✓ 30-day performance monitoring</div>
                      <div>✓ Real-time queue adjustments</div>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartEvaluation}
                    size="lg"
                    className="bg-orange-600 hover:bg-orange-700 text-white text-lg px-8 py-4"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get Personalized Quote
                  </Button>

                  <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4" />
                      <span>100% Safe & Secure</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Guaranteed Results</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>Real-time Monitoring</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Multi-Account Injection Selection */}
        {injectionStep === "pricing" && injectionAccounts.length > 0 && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span>Multi-Account Injection Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Select Accounts for Injection</h4>
                <div className="space-y-3">
                  {injectionAccounts.map((account, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={account.selected}
                          onChange={() => toggleAccountSelection(account.email)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{account.email}</div>
                          <div className="text-sm text-gray-600">
                            Position: #{account.analysisResult.currentPosition.toLocaleString()} • Health:{" "}
                            {account.analysisResult.accountHealth}%
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-orange-600">${account.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              {injectionAccounts.some((account) => account.selected) && (
                <div className="bg-white p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4">Pricing Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Selected Accounts ({injectionAccounts.filter((a) => a.selected).length})
                      </span>
                      <span className="font-semibold">
                        ${injectionAccounts.filter((a) => a.selected).reduce((sum, a) => sum + a.price, 0)}
                      </span>
                    </div>
                    {injectionDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Bulk Discount ({Math.round(injectionDiscount * 100)}% off)</span>
                        <span className="font-semibold">
                          -$
                          {Math.round(
                            injectionAccounts.filter((a) => a.selected).reduce((sum, a) => sum + a.price, 0) *
                              injectionDiscount,
                          )}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Price</span>
                        <span className="text-orange-600">${Math.round(totalInjectionPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 text-center">Choose Payment Method</h4>
                    
                    {/* Venmo Payment */}
                    <a
                      href={`https://venmo.com/linelogic?txn=pay&amount=${Math.round(totalInjectionPrice)}&note=${encodeURIComponent(`LineLogic Multi-Account Injection (${injectionAccounts.filter((a) => a.selected).length} accounts)`)}&audience=private`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-4 p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg font-semibold mb-3 w-full"
                      onClick={() => handlePayment("venmo")}
                    >
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.135 5.938c1.047-1.047 2.719-1.047 3.766 0 1.047 1.047 1.047 2.719 0 3.766L12.766 13.84c-1.047 1.047-2.719 1.047-3.766 0-1.047-1.047-1.047-2.719 0-3.766l4.135-4.136z" />
                        <path d="M7.5 18.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Pay ${Math.round(totalInjectionPrice)} with Venmo</div>
                        <div className="text-sm text-blue-100">
                          {injectionAccounts.filter((a) => a.selected).length} account injection
                        </div>
                      </div>
                    </a>

                    {/* Bitcoin Payment */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('bc1qkq3wz5zmaxq384q05wavzcyzguc4rqm5ypyyku');
                        alert(`Bitcoin address copied! Send $${Math.round(totalInjectionPrice)} and contact us with transaction details.`);
                        handlePayment("bitcoin");
                      }}
                      className="flex items-center justify-center space-x-4 p-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-lg font-semibold mb-3 w-full"
                    >
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.28 11.408c-.177-.36-.453-.648-.8-.833.328-.165.576-.417.714-.728.143-.32.166-.668.067-.994-.203-.665-.745-1.074-1.407-1.074-.662 0-1.204.409-1.407 1.074-.099.326-.076.674.067.994.138.311.386.563.714.728-.347.185-.623.473-.8.833-.203.416-.203.895 0 1.311.203.416.553.728.998.728s.795-.312.998-.728c.203-.416.203-.895 0-1.311z"/>
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Pay ${Math.round(totalInjectionPrice)} with Bitcoin</div>
                        <div className="text-sm text-orange-100">Click to copy address</div>
                      </div>
                    </button>

                    {/* Ethereum Payment */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('0x6FBe192da821d39d9D04d8089D6957F659885632');
                        alert(`Ethereum address copied! Send $${Math.round(totalInjectionPrice)} and contact us with transaction details.`);
                        handlePayment("ethereum");
                      }}
                      className="flex items-center justify-center space-x-4 p-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-lg font-semibold w-full"
                    >
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                      </svg>
                      <div className="text-left">
                        <div className="font-semibold">Pay ${Math.round(totalInjectionPrice)} with Ethereum</div>
                        <div className="text-sm text-purple-100">Click to copy address</div>
                      </div>
                    </button>
                  </div>

                  {injectionDiscount > 0 && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        <Sparkles className="h-4 w-4" />
                        <span>
                          You saved $
                          {Math.round(
                            injectionAccounts.filter((a) => a.selected).reduce((sum, a) => sum + a.price, 0) *
                              injectionDiscount,
                          )}{" "}
                          with bulk discount!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Bulk Discount Tiers</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>
                    • 3+ accounts: <strong>10% off</strong>
                  </div>
                  <div>
                    • 5+ accounts: <strong>15% off</strong>
                  </div>
                  <div>
                    • 10+ accounts: <strong>25% off</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Single Account Evaluation Progress */}
        {injectionStep === "evaluating" && injectionAccounts.length === 0 && (
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
                <span>Evaluating Your Account...</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Evaluation Progress</span>
                  <span className="text-sm text-gray-600">{Math.round(evaluationProgress)}%</span>
                </div>
                <Progress value={evaluationProgress} className="h-3" />
              </div>

              <div className="space-y-4">
                {evaluationSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      index === currentEvaluationStep
                        ? "border-orange-300 bg-orange-50"
                        : index < currentEvaluationStep
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {index < currentEvaluationStep ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : index === currentEvaluationStep ? (
                          <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className="font-medium text-gray-900">{step.title}</span>
                      </div>
                      <span className="text-sm text-gray-600">{Math.round(step.progress)}%</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{step.description}</p>
                    {index === currentEvaluationStep && (
                      <div className="mt-2 ml-6">
                        <Progress value={step.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-sm text-orange-700">
                  <strong>Analyzing account complexity and market conditions...</strong>
                </p>
                <p className="text-xs text-orange-600 mt-1">This evaluation takes approximately 15 seconds</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Single Account Personalized Pricing */}
        {injectionStep === "pricing" && injectionAccounts.length === 0 && analysisResult && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Your Personalized Quote</h3>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  Based on your account analysis, we've calculated a personalized price for your injection service.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Service</span>
                      <span className="font-semibold">$120.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Complexity Adjustment</span>
                      <span className="font-semibold">${((analysisResult.complexityScore - 5) * 8).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Urgency Factor</span>
                      <span className="font-semibold">
                        ${(personalizedPrice - 120 - (analysisResult.complexityScore - 5) * 8).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Your Price</span>
                        <span className="text-green-600">${personalizedPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700">Advanced position optimization</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700">30-day performance monitoring</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700">Real-time queue adjustments</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700">Priority customer support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-gray-700">Success guarantee</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Complete Your Injection</h4>
                
                {/* Venmo Payment */}
                <a
                  href={`https://venmo.com/linelogic?txn=pay&amount=${personalizedPrice}&note=${encodeURIComponent("LineLogic Account Injection Service")}&audience=private`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-4 p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-lg font-semibold mb-3 w-full max-w-md"
                  onClick={() => handlePayment("venmo")}
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.135 5.938c1.047-1.047 2.719-1.047 3.766 0 1.047 1.047 1.047 2.719 0 3.766L12.766 13.84c-1.047 1.047-2.719 1.047-3.766 0-1.047-1.047-1.047-2.719 0-3.766l4.135-4.136z" />
                    <path d="M7.5 18.5c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold">Pay ${personalizedPrice} with Venmo</div>
                    <div className="text-sm text-blue-100">Quick & secure payment</div>
                  </div>
                </a>

                {/* Bitcoin Payment */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('bc1qkq3wz5zmaxq384q05wavzcyzguc4rqm5ypyyku');
                    alert(`Bitcoin address copied! Send $${personalizedPrice} and contact us with transaction details.`);
                    handlePayment("bitcoin");
                  }}
                  className="inline-flex items-center justify-center space-x-4 p-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-lg font-semibold mb-3 w-full max-w-md"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.28 11.408c-.177-.36-.453-.648-.8-.833.328-.165.576-.417.714-.728.143-.32.166-.668.067-.994-.203-.665-.745-1.074-1.407-1.074-.662 0-1.204.409-1.407 1.074-.099.326-.076.674.067.994.138.311.386.563.714.728-.347.185-.623.473-.8.833-.203.416-.203.895 0 1.311.203.416.553.728.998.728s.795-.312.998-.728c.203-.416.203-.895 0-1.311z"/>
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold">Pay ${personalizedPrice} with Bitcoin</div>
                    <div className="text-sm text-orange-100">Click to copy address</div>
                  </div>
                </button>

                {/* Ethereum Payment */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('0x6FBe192da821d39d9D04d8089D6957F659885632');
                    alert(`Ethereum address copied! Send $${personalizedPrice} and contact us with transaction details.`);
                    handlePayment("ethereum");
                  }}
                  className="inline-flex items-center justify-center space-x-4 p-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-lg font-semibold w-full max-w-md"
                >
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold">Pay ${personalizedPrice} with Ethereum</div>
                    <div className="text-sm text-purple-100">Click to copy address</div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Payment */}
        {injectionStep === "processing" && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment</h3>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Your payment is being securely processed. Please wait, this may take a few moments.
              </p>
              <p className="text-sm text-gray-600 mt-4">
                Payment Method: <strong>{selectedPaymentMethod}</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Fun Injection Animation */}
        {injectionStep === "injecting" && (
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-blue-50">
            <CardContent className="p-8 text-center">
              <div className="relative mb-8">
                <div className="flex items-center justify-center space-x-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-12 w-12 text-gray-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Syringe className="h-8 w-8 text-orange-600 animate-pulse" />
                    <div className="flex space-x-1">
                      <Droplets className="h-4 w-4 text-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <Droplets className="h-4 w-4 text-blue-500 animate-bounce" style={{ animationDelay: "200ms" }} />
                      <Droplets className="h-4 w-4 text-blue-500 animate-bounce" style={{ animationDelay: "400ms" }} />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-12 w-12 text-green-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-4">Injecting Premium Queue Juice! 💉</h3>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
                Our proprietary algorithms are now optimizing your account positioning. The premium juice is flowing
                through our secure injection pipeline...
              </p>

              <div className="bg-white p-6 rounded-lg max-w-md mx-auto">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-700">Establishing secure injection tunnel</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                      style={{ animationDelay: "500ms" }}
                    ></div>
                    <span className="text-sm text-gray-700">Deploying premium queue juice</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                      style={{ animationDelay: "1000ms" }}
                    ></div>
                    <span className="text-sm text-gray-700">Optimizing position algorithms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                      style={{ animationDelay: "1500ms" }}
                    ></div>
                    <span className="text-sm text-gray-700">Activating monitoring systems</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-6">
                <strong>Real injection in progress!</strong> This process typically takes 15-30 seconds. 
                Your accounts are being optimized with our proprietary queue positioning algorithms.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Injection Complete */}
        {injectionStep === "complete" && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Injection Complete! 🎉</h3>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">
                <strong>✅ Injection Successfully Completed!</strong><br/>
                {injectionAccounts.length > 0
                  ? `Your ${injectionAccounts.filter((a) => a.selected).length} accounts have been enhanced with our premium queue optimization algorithms.`
                  : "Your account has been enhanced with our premium queue optimization algorithms."}
                <br/><br/>
                <strong>Expected Results:</strong> You should see significant improvements in your queue positions within the next 1-3 hours.
                The injection is now active and will continue working for future events.
              </p>

              <div className="bg-white p-6 rounded-lg mb-6 max-w-md mx-auto">
                <h4 className="font-semibold text-gray-900 mb-3">✨ Injection Details</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Accounts Enhanced:</span>
                    <span className="font-semibold">{injectionAccounts.filter(a => a.selected).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-semibold capitalize">{selectedPaymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Investment:</span>
                    <span className="font-semibold">${paymentAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Status:</span>
                    <span className="font-semibold text-green-600">✅ Active</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h5 className="font-semibold text-blue-900 mb-2">🚀 What Happens Next?</h5>
                <div className="text-sm text-blue-800 text-left space-y-1">
                  <p>• Your accounts are now optimized for better queue positions</p>
                  <p>• The service remains active for future events automatically</p>
                  <p>• You'll see improvements within 1-3 hours</p>
                  <p>• Continue using these accounts normally for best results</p>
                </div>
              </div>
                <h4 className="font-semibold text-gray-900 mb-3">Injection Summary</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Accounts Injected:</span>
                    <span className="font-semibold">
                      {injectionAccounts.length > 0 ? injectionAccounts.filter((a) => a.selected).length : 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Investment:</span>
                    <span className="font-semibold">
                      ${injectionAccounts.length > 0 ? Math.round(totalInjectionPrice) : personalizedPrice}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-semibold capitalize">{selectedPaymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-xs">INJ-{Date.now().toString().slice(-8)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-6 max-w-md mx-auto">
                <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>• Queue improvements activate within 2-4 hours</div>
                  <div>• Real-time monitoring begins immediately</div>
                  <div>• Email notifications for major position changes</div>
                  <div>• 30-day optimization period starts now</div>
                  <div>• Premium juice maintains potency for 30-45 days</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-green-600 hover:bg-green-700 text-white">View Monitoring Dashboard</Button>
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent">
                  Download Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Confirmation Modal */}
        {showPaymentConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-center">Payment Confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <p className="text-lg font-semibold mb-2">
                    Pay ${paymentAmount} with {selectedPaymentType === "venmo" ? "Venmo" : selectedPaymentType === "bitcoin" ? "Bitcoin" : "Ethereum"}
                  </p>
                  <p className="text-gray-600">
                    {paymentService === "credits" ? "Credit Purchase" : "Account Injection Service"}
                  </p>
                </div>

                {/* Confirmation Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-blue-800">
                    <div className="font-semibold mb-2">Credits will be added:</div>
                    {selectedPaymentType === "venmo" && (
                      <div>• Upon manual verification by our team (1-2 hours)</div>
                    )}
                    {selectedPaymentType === "bitcoin" && (
                      <div>• After 1 blockchain confirmation (~10-60 minutes)</div>
                    )}
                    {selectedPaymentType === "ethereum" && (
                      <div>• After 55 blockchain confirmations (~10-15 minutes)</div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedPaymentType === "venmo" ? "Venmo Receipt Number" : "Transaction ID"}
                  </label>
                  <input
                    type="text"
                    value={receiptInput}
                    onChange={(e) => setReceiptInput(e.target.value)}
                    placeholder={
                      selectedPaymentType === "venmo" 
                        ? "Enter receipt number" 
                        : selectedPaymentType === "bitcoin"
                        ? "Enter Bitcoin transaction hash"
                        : "Enter Ethereum transaction hash"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReceiptSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Confirm Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
