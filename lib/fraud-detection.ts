import { supabase } from './supabase'

interface FraudCheckResult {
  allowed: boolean
  banned: boolean
  score: number
  reason?: string
  actionTaken?: string
}

interface SignupData {
  email: string
  name: string
  ipAddress: string
  userAgent?: string
  deviceFingerprint?: string
}

export class FraudDetectionService {
  
  // Main fraud detection entry point
  static async checkSignupFraud(data: SignupData): Promise<FraudCheckResult> {
    const { email, name, ipAddress, userAgent } = data

    try {
      // 1. Check if IP is already banned
      const { data: ipBanned } = await supabase.rpc('is_ip_banned', { 
        check_ip: ipAddress 
      })

      if (ipBanned) {
        await this.logFraudAttempt({
          ...data,
          fraudType: 'banned_ip',
          severity: 'critical',
          actionTaken: 'blocked'
        })

        return {
          allowed: false,
          banned: true,
          score: 1000,
          reason: 'IP_BANNED',
          actionTaken: 'blocked'
        }
      }

      // 2. Calculate comprehensive fraud score
      const { data: fraudScore } = await supabase.rpc('calculate_fraud_score', {
        email_input: email,
        name_input: name,
        ip_input: ipAddress,
        user_agent_input: userAgent
      })

      // 3. Determine action based on score
      if (fraudScore >= 1000) {
        // Instant ban - likely fraud name or repeated severe violations
        await this.banIP(ipAddress, `Fraud name detection: "${name}"`, 'system')
        
        await this.logFraudAttempt({
          ...data,
          fraudType: 'name_fraud',
          severity: 'critical',
          actionTaken: 'banned'
        })

        return {
          allowed: false,
          banned: true,
          score: fraudScore,
          reason: 'FRAUD_NAME_DETECTED',
          actionTaken: 'banned'
        }
      }

      if (fraudScore >= 500) {
        // High risk - block but don't ban IP yet
        await this.logFraudAttempt({
          ...data,
          fraudType: 'high_risk',
          severity: 'high',
          actionTaken: 'blocked'
        })

        return {
          allowed: false,
          banned: false,
          score: fraudScore,
          reason: 'HIGH_RISK_SIGNUP',
          actionTaken: 'blocked'
        }
      }

      if (fraudScore >= 200) {
        // Medium risk - flag for manual review
        await this.logFraudAttempt({
          ...data,
          fraudType: 'suspicious',
          severity: 'medium',
          actionTaken: 'flagged'
        })

        return {
          allowed: false,
          banned: false,
          score: fraudScore,
          reason: 'MANUAL_REVIEW_REQUIRED',
          actionTaken: 'flagged'
        }
      }

      // Low risk - allow signup
      return {
        allowed: true,
        banned: false,
        score: fraudScore,
        actionTaken: 'allowed'
      }

    } catch (error) {
      console.error('Fraud detection error:', error)
      
      // On error, be conservative and block
      return {
        allowed: false,
        banned: false,
        score: 999,
        reason: 'SYSTEM_ERROR',
        actionTaken: 'blocked'
      }
    }
  }

  // Check specific fraud patterns
  static async checkNameFraud(name: string): Promise<boolean> {
    try {
      const { data: isFraud } = await supabase.rpc('is_fraud_name', { 
        name_input: name 
      })
      return isFraud || false
    } catch (error) {
      console.error('Name fraud check error:', error)
      return true // Conservative: assume fraud on error
    }
  }

  static async checkDomainAllowed(email: string): Promise<boolean> {
    try {
      const { data: isAllowed } = await supabase.rpc('is_domain_allowed', { 
        email_input: email 
      })
      return isAllowed || false
    } catch (error) {
      console.error('Domain check error:', error)
      return false // Conservative: block on error
    }
  }

  static async normalizeEmail(email: string): Promise<string> {
    try {
      const { data: normalized } = await supabase.rpc('normalize_email', { 
        email_input: email 
      })
      return normalized || email
    } catch (error) {
      console.error('Email normalization error:', error)
      return email.toLowerCase()
    }
  }

  // Ban an IP address
  private static async banIP(
    ipAddress: string, 
    reason: string, 
    bannedBy: string = 'system'
  ): Promise<void> {
    try {
      await supabase.rpc('ban_ip_address', {
        ip_input: ipAddress,
        reason_input: reason,
        banned_by_input: bannedBy
      })
    } catch (error) {
      console.error('Failed to ban IP:', error)
    }
  }

  // Log fraud attempt
  private static async logFraudAttempt(data: {
    email: string
    name: string
    ipAddress: string
    userAgent?: string
    fraudType: string
    severity: string
    actionTaken: string
    metadata?: any
  }): Promise<void> {
    try {
      await supabase.rpc('log_fraud_attempt', {
        ip_input: data.ipAddress,
        email_input: data.email,
        name_input: data.name,
        user_agent_input: data.userAgent || null,
        fraud_type_input: data.fraudType,
        severity_input: data.severity,
        action_input: data.actionTaken,
        metadata_input: data.metadata || {}
      })
    } catch (error) {
      console.error('Failed to log fraud attempt:', error)
    }
  }

  // Check rate limits for IP
  static async checkRateLimit(ipAddress: string): Promise<{
    allowed: boolean
    attempts: number
    resetTime?: Date
  }> {
    try {
      const { data: attempts, error } = await supabase
        .from('signup_attempts')
        .select('id')
        .eq('ip_address', ipAddress)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error

      const attemptCount = attempts?.length || 0
      
      if (attemptCount >= 5) {
        return {
          allowed: false,
          attempts: attemptCount,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }

      return {
        allowed: true,
        attempts: attemptCount
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { allowed: false, attempts: 999 }
    }
  }

  // Get client IP address from request
  static getClientIP(req: Request | any): string {
    // Try various headers in order of preference
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'true-client-ip',
      'forwarded'
    ]

    for (const header of headers) {
      const value = req.headers?.[header] || req.headers?.get?.(header)
      if (value) {
        // Take first IP if comma-separated
        const ip = value.split(',')[0].trim()
        if (ip && ip !== 'unknown') {
          return ip
        }
      }
    }

    // Fallback to connection remote address
    return req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.ip || 
           '127.0.0.1'
  }

  // Error messages for different fraud types
  static getFraudErrorMessage(reason: string): string {
    const messages = {
      'IP_BANNED': 'We don\'t onboard bots or bullshit. This IP is permanently blocked.',
      'FRAUD_NAME_DETECTED': 'You tried it. We caught it. You\'re done.',
      'HIGH_RISK_SIGNUP': 'That domain isn\'t eligible for signup at this time.',
      'MANUAL_REVIEW_REQUIRED': 'Your signup attempt triggered an automated fraud ban. No further access will be granted from this location.',
      'SYSTEM_ERROR': 'Unable to process signup at this time.'
    }

    return messages[reason as keyof typeof messages] || 
           'Your signup attempt violates our policies. Access denied.'
  }
}
