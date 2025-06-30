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
  const saveAnalysisToHistory = async (result: DetailedAnalysisResult) => {
    if (!user) return

    console.log("💾 Saving analysis to database and localStorage...")
    
    // Save to database
    try {
      const saveResult = await db.saveAnalysisResult(user.hashedEmail, result)
      console.log("✅ Saved to database:", saveResult)
    } catch (error) {
      console.warn("⚠️ Failed to save to database, using localStorage only:", error)
    }

    // Also save to localStorage as backup
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
  const loadAnalysisHistory = async () => {
    if (!user) return

    console.log("📚 Loading analysis history...")
    
    try {
      // Try to load from database first
      const { data: dbHistory, error } = await db.getAnalysisHistory(user.hashedEmail)
      
      if (dbHistory && !error) {
        console.log(`📚 Loaded ${dbHistory.length} results from database`)
        const historyResults = dbHistory.map((record: any) => record.analysis_data as DetailedAnalysisResult)
        setAnalysisHistory(historyResults)
        return
      } else {
        console.warn("⚠️ Failed to load from database:", error)
      }
    } catch (error) {
      console.warn("⚠️ Database history load failed:", error)
    }

    // Fallback to localStorage
    console.log("📚 Loading from localStorage as fallback...")
    const historyKey = `analysis_history_${user.hashedEmail}`
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]")
    console.log(`📚 Loaded ${history.length} results from localStorage`)
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

    // Update user state immediately for responsiveness
    const updatedUser = { ...user, credits: newCredits }
    setUser(updatedUser)
    
    // Use proper database credit deduction
    try {
      const creditDifference = user.credits - newCredits
      if (creditDifference > 0) {
        // Deducting credits
        const result = await db.deductCredits(user.hashedEmail, creditDifference, "queue_analysis")
        console.log(`✅ Database credit deduction result:`, result)
      } else if (creditDifference < 0) {
        // Adding credits
        const result = await db.addCredits(user.hashedEmail, Math.abs(creditDifference), "credit_purchase")
        console.log(`✅ Database credit addition result:`, result)
      }
    } catch (error) {
      console.warn("⚠️ Failed to update credits in database (using in-memory only):", error)
      // Don't revert user state - just continue with in-memory credits
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

    console.log("🔬 Analysis complete, generating result...")
    const result = generateAnalysisResult(email)
    console.log("🔬 Generated result:", result)
    
    console.log("🔬 Setting analysis result...")
    setAnalysisResult(result)
    
    console.log("🔬 Saving to history...")
    saveAnalysisToHistory(result)
    
    console.log("🔬 Updating credits...")
    updateUserCredits(user.credits - 5) // Remove await to prevent blocking
    
    console.log("🔬 Setting analysis step to complete...")
    setAnalysisStep("complete")
    console.log("✅ Analysis process finished!")
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

    updateUserCredits(user.credits - totalCost) // Remove await
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
    if (!user) return;
    setSelectedCreditPackage({ credits: amount, price });
    setPaymentService("credits");
    setPaymentAmount(price);
    setShowPaymentConfirm(true);
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
    } catch (e) {
      console.error("Catastrophic logout error", e);
    } finally {
      setUser(null);
      setAuthStep("login");
      setAuthLoading(false);
      // Clear all local storage related to user data on logout
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("analysis_history_") || key.startsWith("verification_")) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const resetToIdle = () => {
    setAnalysisStep("idle");
    setInjectionStep("idle");
    setAnalysisResult(null);
    setBulkResults([]);
    setEmail("");
    setBulkEmails("");
  };

  // #region UI Rendering
  const renderAuthForms = () => (
    <div className="max-w-md mx-auto mt-10">
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-blue-600">
            {authStep === "login" && "Welcome Back"}
            {authStep === "register" && "Create Your Account"}
            {authStep === "verify-email" && "Verify Your Email"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {authStep !== "verify-email" ? (
            <Tabs value={authStep} onValueChange={(value) => setAuthStep(value as "login" | "register")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <Input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="bg-white border-gray-300" />
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="bg-white border-gray-300" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600">
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={authLoading}>
                    {authLoading ? <Loader2 className="animate-spin" /> : "Login"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <Input type="text" placeholder="Full Name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required className="bg-white border-gray-300" />
                  <Input type="email" placeholder="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required className="bg-white border-gray-300" />
                  <Input type="password" placeholder="Password (min. 6 characters)" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required className="bg-white border-gray-300" />
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={authLoading}>
                    {authLoading ? <Loader2 className="animate-spin" /> : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleVerifyEmail} className="space-y-4 mt-4">
              <p className="text-center text-gray-600">A verification code has been sent to your console.</p>
              <Input type="text" placeholder="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required className="bg-white border-gray-300" />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={authLoading}>
                {authLoading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
              </Button>
              <Button type="button" variant="link" onClick={resendVerificationCode} className="w-full text-blue-600">Resend Code</Button>
            </form>
          )}
          {authError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalysisResults = (result: DetailedAnalysisResult) => (
    <Card className="bg-white border-gray-200 shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-gray-900">
          <span>Analysis for: {result.email}</span>
          <Badge variant={result.riskLevel === 'low' ? 'default' : result.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
            {result.riskLevel.toUpperCase()} RISK
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-900">
              <p>Current Position: <span className="font-bold text-blue-600">{result.currentPosition.toLocaleString()}</span></p>
              <p>Est. Improvement: <span className="font-bold text-orange-500">{result.estimatedImprovement.toLocaleString()}</span></p>
              <p>Account Health: <span className="font-bold text-green-600">{result.accountHealth}%</span></p>
              <p>Recommended Action: <span className="font-bold">{result.recommendedAction}</span></p>
            </div>
            <div className="mt-4">
              <Button onClick={handleStartEvaluation} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Zap className="mr-2 h-4 w-4" /> Start Injection Evaluation
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="details" className="mt-4 text-gray-900">
             <p>Account Age: {result.accountAge} days</p>
             <p>Success Rate: {result.successRate}%</p>
             <p>IP Reputation: {result.ipReputation}%</p>
          </TabsContent>
          <TabsContent value="history" className="mt-4 text-gray-900">
            <ul>
              {result.positionHistory.map((h, i) => (
                <li key={i}>{h.date}: Position {h.position} for {h.event}</li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  const renderMainApp = () => (
    <div>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">LineLogic</h1>
          <p className="text-gray-600">Queue Analysis & Injection Tool</p>
        </div>
        {user && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Button onClick={() => setShowHistory(true)} variant="ghost" size="sm">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button onClick={() => setShowBuyCredits(true)} variant="outline" size="sm">
              <Sparkles className="mr-2 h-4 w-4" /> {user.credits} Credits
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        )}
      </header>

      <main>
        {injectionStep !== 'idle' ? (
          // Render Injection Flow
          <div className="space-y-6">
            {injectionStep === 'evaluating' && (
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Evaluating Injection Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={evaluationProgress} className="w-full" />
                    {evaluationSteps.map((step, index) => (
                      <div key={index} className={`p-3 rounded ${index === currentEvaluationStep ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900">{step.title}</span>
                          <span className="text-sm text-gray-600">{step.progress}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        <Progress value={step.progress} className="w-full mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {injectionStep === 'pricing' && analysisResult && (
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Injection Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Account: {analysisResult.email}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Current Position:</span>
                          <span className="font-semibold text-gray-900 ml-2">{analysisResult.currentPosition.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Target Position:</span>
                          <span className="font-semibold text-green-600 ml-2">{analysisResult.estimatedImprovement.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Complexity Score:</span>
                          <span className="font-semibold text-gray-900 ml-2">{analysisResult.complexityScore}/10</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk Level:</span>
                          <span className={`font-semibold ml-2 ${analysisResult.riskLevel === 'low' ? 'text-green-600' : analysisResult.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {analysisResult.riskLevel.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Personalized Pricing</h4>
                      <div className="text-3xl font-bold text-blue-600 mb-2">${personalizedPrice}</div>
                      <p className="text-sm text-gray-600">
                        Based on account complexity, current position, and urgency multiplier
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Payment Options</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <Button 
                          onClick={() => handlePayment("venmo", "injection", personalizedPrice)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay with Venmo - ${personalizedPrice}
                        </Button>
                        <Button 
                          onClick={() => handlePayment("bitcoin", "injection", personalizedPrice)}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white justify-start"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay with Bitcoin - ${personalizedPrice}
                        </Button>
                        <Button 
                          onClick={() => handlePayment("ethereum", "injection", personalizedPrice)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay with Ethereum - ${personalizedPrice}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setInjectionStep('idle')}
                      variant="outline" 
                      className="w-full"
                    >
                      Cancel Injection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {(injectionStep === 'processing' || injectionStep === 'injecting') && (
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">
                    {injectionStep === 'processing' ? 'Processing Payment...' : 'Injecting Account...'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" />
                    <p className="text-gray-600">
                      {injectionStep === 'processing' 
                        ? 'Verifying payment and preparing injection...' 
                        : 'Optimizing queue position...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {injectionStep === 'complete' && (
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-600">Injection Complete!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    <p className="text-gray-900">Your queue position has been successfully optimized.</p>
                    <Button 
                      onClick={() => {
                        setInjectionStep('idle')
                        setAnalysisStep('idle')
                        setAnalysisResult(null)
                        setEmail('')
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Start New Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Render Analysis Flow
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Account Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisStep === 'idle' && (
                <form onSubmit={handleAnalyze}>
                  <Input
                    type="email"
                    placeholder="Enter email to analyze"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-gray-300"
                  />
                  <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" disabled={!email || (user?.credits ?? 0) < 5}>
                    Analyze (5 Credits)
                  </Button>
                </form>
              )}
              {analysisStep === 'analyzing' && (
                <div>
                  <p className="text-gray-900">Analyzing...</p>
                  <Progress value={analysisProgress} className="w-full" />
                  <ul className="mt-2">
                    {analysisSteps.map((step, i) => <li key={i} className="text-gray-700">{step}</li>)}
                  </ul>
                </div>
              )}
              {analysisStep === 'complete' && analysisResult && (
                <div>
                  {renderAnalysisResults(analysisResult)}
                  <Button onClick={resetToIdle} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">Analyze Another</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
  // #endregion

  // Event handlers and utility functions
  const handleViewHistoryResult = async (result: DetailedAnalysisResult) => {
    if (!user || user.credits < 1) {
      alert("You need 1 credit to view historical results.")
      return
    }

    setAnalysisResult(result)
    updateUserCredits(user.credits - 1) // Remove await
    setShowHistory(false)
    setAnalysisStep("complete")
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
        
        // Try to get profile from database first (with timeout)
        try {
          console.log("🔍 Attempting database profile lookup...")
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database timeout')), 5000)
          )
          const profilePromise = db.getUserProfile(session.user.id)
          
          const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any
          console.log("🔍 Database lookup result:", { profile, error })
          
          if (profile && !error) {
            console.log(`📊 Loaded profile with ${profile.credits} credits`)
            const userData: UserData = {
              email: session.user.email!,
              name: profile.name,
              credits: profile.credits,
              hashedEmail: session.user.id, // Use actual user ID instead of hash
              emailVerified: true,
              registrationDate: profile.created_at
            }
            setUser(userData)
            setEmail(session.user.email!)
            setAuthStep("authenticated")
            return
          } else {
            console.log("🔍 No profile found in database or error occurred:", error)
          }
        } catch (error) {
          console.warn("⚠️ Failed to load profile from database, using fallback:", error)
        }
        
        // Fallback: create a basic user profile for now
        console.log("📊 Creating fallback user profile")
        const userData: UserData = {
          email: session.user.email!,
          name: session.user.email!.split('@')[0], // Use email prefix as name
          credits: 10, // Users start with 10 credits
          hashedEmail: session.user.id, // Use actual user ID
          emailVerified: true,
          registrationDate: new Date().toISOString()
        }
        console.log("📊 Setting fallback user data:", userData)
        setUser(userData)
        setEmail(session.user.email!)
        setAuthStep("authenticated")
        console.log("✅ Auth step set to authenticated")
      } else {
        console.log("🚪 No session, setting to login")
        setUser(null)
        setAuthStep("login")
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {authStep !== "authenticated" ? renderAuthForms() : renderMainApp()}
      </div>
      
      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Analysis History</h2>
              <Button onClick={() => setShowHistory(false)} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div>
              {analysisHistory.length > 0 ? (
                <div className="space-y-4">
                  {analysisHistory.map((result, index) => (
                    <Card key={index} className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{result.email}</p>
                            <p className="text-sm text-gray-600">
                              Position: {result.currentPosition.toLocaleString()} → {result.estimatedImprovement.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleString()}</p>
                          </div>
                          <Button 
                            onClick={() => handleViewHistoryResult(result)}
                            size="sm" 
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            View (1 Credit)
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No analysis history found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Payment Instructions</h2>
              <Button onClick={() => setShowPaymentConfirm(false)} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {selectedPaymentType === "venmo" && (
                <div>
                  <p className="text-gray-900 mb-2">Send payment via Venmo:</p>
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="font-mono text-sm">@linelogic-payments</p>
                    <p className="font-bold text-lg">${paymentAmount}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Include your email in the payment description</p>
                </div>
              )}
              {selectedPaymentType === "bitcoin" && (
                <div>
                  <p className="text-gray-900 mb-2">Send Bitcoin payment to:</p>
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="font-mono text-xs break-all">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
                    <p className="font-bold text-lg">${paymentAmount} USD</p>
                  </div>
                </div>
              )}
              {selectedPaymentType === "ethereum" && (
                <div>
                  <p className="text-gray-900 mb-2">Send Ethereum payment to:</p>
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="font-mono text-xs break-all">0x742d35Cc6634C0532925a3b8D4ec5bB6644bfc5</p>
                    <p className="font-bold text-lg">${paymentAmount} USD</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID / Receipt:
                </label>
                <Input
                  type="text"
                  placeholder="Enter transaction ID or receipt number"
                  value={receiptInput}
                  onChange={(e) => setReceiptInput(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Button 
                onClick={handleReceiptSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!receiptInput.trim()}
              >
                Submit Payment Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
