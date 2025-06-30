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
  signUp: async (email: string, password: string, name: string) => {
    // ✅ Validate inputs are actually strings
    if (typeof email !== "string" || !email.trim()) {
      throw new Error("Email must be a valid string")
    }
    if (typeof password !== "string" || password.length < 6) {
      throw new Error("Password must be at least 6 characters")
    }
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("Name must be a valid string")
    }

    console.log("Supabase signUp called with:", { email: email.trim(), name: name.trim() })

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          credits: 10, // New user bonus - enough for 2 tests
        },
      },
    })
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
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()
    return { data, error }
  },

  // Update user credits
  updateUserCredits: async (userId: string, credits: number) => {
    const { data, error } = await supabase.from("user_profiles").update({ credits }).eq("id", userId).select().single()
    return { data, error }
  },

  // Save analysis result
  saveAnalysisResult: async (userId: string, analysisData: any) => {
    const { data, error } = await supabase
      .from("analysis_results")
      .insert({
        user_id: userId,
        email: analysisData.email,
        analysis_data: analysisData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    return { data, error }
  },

  // Get user's analysis history
  getAnalysisHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from("analysis_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)
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
