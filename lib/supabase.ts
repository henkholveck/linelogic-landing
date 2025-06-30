import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Ensure sessions persist across page refreshes
    autoRefreshToken: true, // Automatically refresh tokens
    detectSessionInUrl: true // Handle auth redirects
  }
})

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, name: string, ipAddress?: string, userAgent?: string) => {
    // ✅ Enhanced validation with fraud detection
    if (typeof email !== "string" || !email.trim()) {
      throw new Error("Email must be a valid string")
    }
    if (typeof password !== "string" || password.length < 6) {
      throw new Error("Password must be at least 6 characters")
    }
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("Name must be a valid string")
    }

    // Enhanced name validation
    const cleanName = name.trim()
    if (cleanName.length < 2) {
      throw new Error("Please enter a valid name")
    }
    if (cleanName.length > 50) {
      throw new Error("Name must be less than 50 characters")
    }

    // Import fraud detection dynamically to avoid circular imports
    const { FraudDetectionService } = await import('./fraud-detection')

    // Get IP address if not provided
    const clientIP = ipAddress || '127.0.0.1'

    // Run comprehensive fraud detection
    const fraudCheck = await FraudDetectionService.checkSignupFraud({
      email: email.trim().toLowerCase(),
      name: cleanName,
      ipAddress: clientIP,
      userAgent: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    })

    // Block if fraud detected
    if (!fraudCheck.allowed) {
      const errorMessage = FraudDetectionService.getFraudErrorMessage(fraudCheck.reason || 'UNKNOWN')
      throw new Error(errorMessage)
    }

    console.log("Supabase signUp called with:", { email: email.trim(), name: cleanName })

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: cleanName,
        },
        emailRedirectTo: `${window?.location?.origin || 'http://localhost:3000'}/login?verified=true`
      },
    })

    // Log signup attempt with fraud score
    if (clientIP) {
      try {
        const normalizedEmail = await FraudDetectionService.normalizeEmail(email.trim().toLowerCase())
        
        await supabase.rpc('log_signup_attempt', {
          user_ip: clientIP,
          user_email: email.trim().toLowerCase(),
          is_success: !error,
          user_agent_string: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null)
        })

        // Store additional fraud detection data
        if (!error && data.user) {
          await supabase
            .from('signup_attempts')
            .update({ 
              fraud_score: fraudCheck.score,
              normalized_email: normalizedEmail
            })
            .eq('email', email.trim().toLowerCase())
            .eq('ip_address', clientIP)
            .order('created_at', { ascending: false })
            .limit(1)
        }
      } catch (logError) {
        console.warn("Failed to log signup attempt:", logError)
      }
    }

    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    // ✅ Validate inputs
    if (typeof email !== "string" || !email.trim()) {
      throw new Error("Email must be a valid string")
    }
    if (typeof password !== "string" || !password) {
      throw new Error("Password is required")
    }

    console.log("Supabase signIn called with email:", email.trim())

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    })
    return { data, error }
  },

  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// Database helper functions
export const db = {
  // Get user profile with credits
  getUserProfile: async (userId: string) => {
    console.log("📊 Getting user profile for:", userId)
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()
    console.log("📊 Profile result:", { data, error })
    return { data, error }
  },

  // Update user credits
  updateUserCredits: async (userId: string, credits: number) => {
    console.log("💳 Updating credits for user:", userId, "to:", credits)
    const { data, error } = await supabase
      .from("user_profiles")
      .update({ credits, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()
    console.log("💳 Credit update result:", { data, error })
    return { data, error }
  },

  // Deduct credits and log transaction
  deductCredits: async (userId: string, amount: number, reason: string) => {
    console.log("💸 Deducting credits:", { userId, amount, reason })
    
    // First get current credits
    const { data: profile, error: profileError } = await db.getUserProfile(userId)
    if (profileError || !profile) {
      console.error("❌ Failed to get profile for credit deduction:", profileError)
      return { data: null, error: profileError }
    }

    const newCredits = profile.credits - amount
    if (newCredits < 0) {
      return { data: null, error: new Error("Insufficient credits") }
    }

    // Update credits
    const { data: updatedProfile, error: updateError } = await db.updateUserCredits(userId, newCredits)
    if (updateError) {
      console.error("❌ Failed to update credits:", updateError)
      return { data: null, error: updateError }
    }

    // Log transaction
    const { error: logError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: -amount,
        type: "debit",
        reason: reason
      })

    if (logError) {
      console.warn("⚠️ Failed to log credit transaction:", logError)
    }

    return { data: updatedProfile, error: null }
  },

  // Add credits and log transaction
  addCredits: async (userId: string, amount: number, reason: string, adminEmail?: string) => {
    console.log("💰 Adding credits:", { userId, amount, reason, adminEmail })
    
    const { data: profile, error: profileError } = await db.getUserProfile(userId)
    if (profileError || !profile) {
      return { data: null, error: profileError }
    }

    const newCredits = profile.credits + amount
    const { data: updatedProfile, error: updateError } = await db.updateUserCredits(userId, newCredits)
    if (updateError) {
      return { data: null, error: updateError }
    }

    // Log transaction
    await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: amount,
        type: "credit",
        reason: reason,
        admin_email: adminEmail
      })

    return { data: updatedProfile, error: null }
  },

  // Save analysis result
  saveAnalysisResult: async (userId: string, analysisData: any) => {
    console.log("📊 Saving analysis result for:", userId)
    const { data, error } = await supabase
      .from("analysis_results")
      .insert({
        user_id: userId,
        email: analysisData.email,
        analysis_data: analysisData,
        credits_used: 5
      })
      .select()
      .single()
    console.log("📊 Analysis save result:", { data, error })
    return { data, error }
  },

  // Get user's analysis history
  getAnalysisHistory: async (userId: string) => {
    console.log("📚 Getting analysis history for:", userId)
    const { data, error } = await supabase
      .from("analysis_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
    console.log("📚 History result:", { count: data?.length, error })
    return { data, error }
  },

  // Save injection record
  saveInjectionRecord: async (userId: string, injectionData: any) => {
    const { data, error } = await supabase
      .from("injection_records")
      .insert({
        user_id: userId,
        accounts: injectionData.accounts,
        total_price: injectionData.totalPrice,
        payment_method: injectionData.paymentMethod,
        status: "completed",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    return { data, error }
  },

  // Save payment receipt for manual verification
  savePaymentReceipt: async (userId: string, receiptData: any) => {
    const { data, error } = await supabase
      .from("payment_receipts")
      .insert({
        user_id: userId,
        payment_type: receiptData.paymentType,
        service_type: receiptData.serviceType,
        amount: receiptData.amount,
        receipt_id: receiptData.receiptId,
        status: "pending_verification",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    return { data, error }
  },

  // Admin functions
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })
    return { data, error }
  },

  getAllPaymentReceipts: async () => {
    const { data, error } = await supabase
      .from("payment_receipts")
      .select("*")
      .order("created_at", { ascending: false })
    return { data, error }
  },

  updatePaymentReceiptStatus: async (receiptId: string, status: string, adminEmail: string) => {
    const { data, error } = await supabase
      .from("payment_receipts")
      .update({
        status: status,
        verified_by: adminEmail,
        verified_at: new Date().toISOString(),
      })
      .eq("id", receiptId)
    return { data, error }
  },

  logCreditTransaction: async (transactionData: any) => {
    const { data, error } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: transactionData.userId,
        amount: transactionData.amount,
        type: transactionData.type,
        reason: transactionData.reason,
        admin_email: transactionData.adminEmail,
        created_at: new Date().toISOString(),
      })
    return { data, error }
  },
}
