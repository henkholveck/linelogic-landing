import { supabase } from './supabase'

interface InjectionResult {
  id: string
  email: string
  originalPosition: number
  newPosition: number
  injectionTime: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
  performanceGain: number
}

interface TestResult {
  id: string
  email: string
  testType: 'basic' | 'advanced' | 'premium'
  queuePosition: number
  latency: number
  success: boolean
  timestamp: Date
  injectionApplied: boolean
  injectionId?: string
}

export class InjectionService {
  
  // Execute juice injection for an account
  static async executeInjection(
    userId: string, 
    email: string, 
    currentPosition: number
  ): Promise<InjectionResult> {
    try {
      // Check user has sufficient credits (injection costs vary by position)
      const injectionCost = this.calculateInjectionCost(currentPosition)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (!profile || profile.credits < injectionCost) {
        throw new Error(`Insufficient credits. Injection requires ${injectionCost} credits.`)
      }

      // Deduct credits first
      const { error: deductError } = await supabase.rpc('deduct_credits', {
        user_id: userId,
        amount: injectionCost,
        reason: `Juice injection for ${email}`
      })

      if (deductError) throw deductError

      // Calculate improved position (realistic improvement)
      const improvementFactor = this.calculateImprovementFactor(currentPosition)
      const newPosition = Math.max(1, Math.floor(currentPosition * improvementFactor))
      const performanceGain = ((currentPosition - newPosition) / currentPosition) * 100

      // Save injection record
      const injectionData = {
        user_id: userId,
        email: email,
        original_position: currentPosition,
        new_position: newPosition,
        injection_cost: injectionCost,
        performance_gain: performanceGain,
        status: 'processing',
        created_at: new Date().toISOString()
      }

      const { data: injection, error: saveError } = await supabase
        .from('injection_records')
        .insert(injectionData)
        .select()
        .single()

      if (saveError) throw saveError

      // Simulate processing time (2-5 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

      // Update injection status to completed
      await supabase
        .from('injection_records')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', injection.id)

      return {
        id: injection.id,
        email: email,
        originalPosition: currentPosition,
        newPosition: newPosition,
        injectionTime: new Date(),
        status: 'completed',
        performanceGain: performanceGain
      }

    } catch (error) {
      console.error('Injection failed:', error)
      throw error
    }
  }

  // Run account test
  static async runAccountTest(
    userId: string, 
    email: string, 
    testType: 'basic' | 'advanced' | 'premium' = 'basic'
  ): Promise<TestResult> {
    try {
      const testCost = this.getTestCost(testType)
      
      // Check credits
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', userId)
        .single()

      if (!profile || profile.credits < testCost) {
        throw new Error(`Insufficient credits. ${testType} test requires ${testCost} credits.`)
      }

      // Deduct credits
      await supabase.rpc('deduct_credits', {
        user_id: userId,
        amount: testCost,
        reason: `${testType} test for ${email}`
      })

      // Generate realistic test results
      const testResults = this.generateTestResults(email, testType)

      // Save test record
      const { data: test, error: saveError } = await supabase
        .from('test_results')
        .insert({
          user_id: userId,
          email: email,
          test_type: testType,
          queue_position: testResults.queuePosition,
          latency: testResults.latency,
          success: testResults.success,
          test_cost: testCost,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (saveError) throw saveError

      return {
        id: test.id,
        email: email,
        testType: testType,
        queuePosition: testResults.queuePosition,
        latency: testResults.latency,
        success: testResults.success,
        timestamp: new Date(),
        injectionApplied: false
      }

    } catch (error) {
      console.error('Test failed:', error)
      throw error
    }
  }

  // Get user's injection history
  static async getInjectionHistory(userId: string): Promise<InjectionResult[]> {
    const { data, error } = await supabase
      .from('injection_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return data.map(record => ({
      id: record.id,
      email: record.email,
      originalPosition: record.original_position,
      newPosition: record.new_position,
      injectionTime: new Date(record.created_at),
      status: record.status,
      performanceGain: record.performance_gain
    }))
  }

  // Get user's test history
  static async getTestHistory(userId: string): Promise<TestResult[]> {
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return data.map(record => ({
      id: record.id,
      email: record.email,
      testType: record.test_type,
      queuePosition: record.queue_position,
      latency: record.latency,
      success: record.success,
      timestamp: new Date(record.created_at),
      injectionApplied: record.injection_applied || false,
      injectionId: record.injection_id
    }))
  }

  // Private helper methods
  private static calculateInjectionCost(position: number): number {
    // Higher positions cost more to inject
    if (position > 50000) return 25
    if (position > 10000) return 35
    if (position > 5000) return 50
    if (position > 1000) return 75
    return 100 // Top 1000 positions are most expensive
  }

  private static calculateImprovementFactor(position: number): number {
    // Realistic improvement factors
    if (position > 50000) return 0.15 // 85% improvement
    if (position > 10000) return 0.25 // 75% improvement
    if (position > 5000) return 0.35 // 65% improvement
    if (position > 1000) return 0.45 // 55% improvement
    return 0.6 // 40% improvement for top positions
  }

  private static getTestCost(testType: string): number {
    switch (testType) {
      case 'basic': return 5
      case 'advanced': return 10
      case 'premium': return 20
      default: return 5
    }
  }

  private static generateTestResults(email: string, testType: string) {
    // Generate deterministic but realistic results based on email hash
    let hash = 0
    for (let i = 0; i < email.length; i++) {
      hash = ((hash << 5) - hash) + email.charCodeAt(i)
      hash = hash & hash
    }

    const abs = Math.abs(hash)
    const position = 1000 + (abs % 49000) // 1k-50k range
    const latency = 80 + (abs % 120) // 80-200ms
    const successRate = testType === 'premium' ? 0.95 : testType === 'advanced' ? 0.85 : 0.75

    return {
      queuePosition: position,
      latency: latency,
      success: Math.random() < successRate
    }
  }

  // Monitor injection status
  static async getInjectionStatus(injectionId: string): Promise<string> {
    const { data, error } = await supabase
      .from('injection_records')
      .select('status')
      .eq('id', injectionId)
      .single()

    if (error) throw error
    return data.status
  }
}
