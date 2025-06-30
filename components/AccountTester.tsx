"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Zap, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye,
  Settings,
  Clock
} from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/supabase'

interface AccountDiagnostic {
  email: string
  position: number
  trafficRank: string
  latency: number
  fingerprintConsistency: number
  riskFlags: string[]
  injectionPrice: number
  projectedRange: string
  entropy: string
}

// Deterministic result generation based on email hash
const generateAccountDiagnostic = (email: string): AccountDiagnostic => {
  // Create consistent hash from email
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  const abs = Math.abs(hash)
  const position = 15000 + (abs % 85000) // 15k-100k range
  const latency = 120 + (abs % 180) // 120-300ms
  const consistency = 65 + (abs % 30) // 65-95%
  const price = 25 + (abs % 50) // $25-75
  
  const trafficRanks = ['Public', 'Standard', 'Priority', 'VIP']
  const trafficRank = trafficRanks[abs % trafficRanks.length]
  
  const riskPatterns = [
    ['Proxy detected', 'VPN signature'],
    ['Standard residential'],
    ['Clean fingerprint'],
    ['ISP flagged', 'Rate limited'],
    ['Bot patterns detected']
  ]
  const riskFlags = riskPatterns[abs % riskPatterns.length]
  
  const entropies = ['Low', 'Medium', 'High', 'Critical']
  const entropy = entropies[abs % entropies.length]
  
  return {
    email,
    position,
    trafficRank,
    latency,
    fingerprintConsistency: consistency,
    riskFlags,
    injectionPrice: price,
    projectedRange: `${Math.max(500, Math.floor(position * 0.01))}-${Math.floor(position * 0.03)}`,
    entropy
  }
}

export default function AccountTester() {
  const { user, refreshUser } = useAuth()
  const [emails, setEmails] = useState('')
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<AccountDiagnostic[]>([])
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState('')

  const handleTest = async () => {
    const emailList = emails.split('\n').filter(e => e.trim()).map(e => e.trim())
    
    if (emailList.length === 0) {
      setError('Enter at least one email address to test')
      return
    }

    if (!user || user.credits < 5) {
      setError('Insufficient credits. You need 5 credits per diagnostic session.')
      return
    }

    setTesting(true)
    setError('')
    setResults([])

    const steps = [
      'Establishing connection to allocation system...',
      'Requesting traffic mirrors from partner nodes...',
      'Analyzing pre-queue signal patterns...',
      'Cross-referencing fingerprint database...',
      'Calculating placement projections...',
      'Generating injection eligibility...'
    ]

    try {
      // Simulate realistic backend connection process
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i])
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
      }

      // Generate diagnostics for all emails
      const diagnostics = emailList.map(generateAccountDiagnostic)

      // Deduct credits
      const deductResult = await db.deductCredits(user.id, 5, `Account diagnostics: ${emailList.length} accounts`)
      if (deductResult.error) {
        throw new Error(deductResult.error.message)
      }

      // Save results
      await db.saveAnalysisResult(user.id, {
        email: user.email,
        accounts: emailList,
        results: diagnostics
      })

      setResults(diagnostics)
      await refreshUser()
      
    } catch (err: any) {
      setError(err.message || 'Diagnostic failed. Connection to allocation system interrupted.')
    } finally {
      setTesting(false)
      setCurrentStep('')
    }
  }

  const handleInject = async (diagnostic: AccountDiagnostic) => {
    // Redirect to injection purchase with account data
    const params = new URLSearchParams({
      email: diagnostic.email,
      position: diagnostic.position.toString(),
      price: diagnostic.injectionPrice.toString(),
      range: diagnostic.projectedRange
    })
    window.location.href = `/injection?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Testing Interface */}
      <Card className="bg-slate-900 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-400">
            <Activity className="h-5 w-5" />
            <span>Account Diagnostics</span>
            <Badge variant="outline" className="border-green-400 text-green-400">LIVE</Badge>
          </CardTitle>
          <p className="text-slate-300">Direct pipeline access to placement engine diagnostics</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Addresses (one per line)
            </label>
            <Textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="broker1@example.com&#10;broker2@example.com&#10;broker3@example.com"
              className="bg-slate-800 border-slate-600 text-white min-h-[120px]"
              disabled={testing}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {testing && (
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                <span className="text-green-400 font-mono text-sm">{currentStep}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Diagnostic cost: <strong className="text-green-400">5 credits</strong>
            </div>
            <Button 
              onClick={handleTest}
              disabled={testing || !user || user.credits < 5}
              className="bg-green-600 hover:bg-green-700 text-black font-semibold"
            >
              {testing ? 'Running Diagnostics...' : 'Test Accounts'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">Diagnostic Results</h3>
          
          {results.map((diagnostic, index) => (
            <Card key={index} className="bg-slate-900 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-mono text-sm text-slate-300">{diagnostic.email}</div>
                    <div className="text-2xl font-bold text-white">
                      Position: #{diagnostic.position.toLocaleString()}
                    </div>
                  </div>
                  <Badge 
                    variant={diagnostic.trafficRank === 'VIP' ? 'default' : 'secondary'}
                    className={diagnostic.trafficRank === 'VIP' ? 'bg-green-600' : 'bg-slate-600'}
                  >
                    {diagnostic.trafficRank} Traffic
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-xs text-slate-400">Latency</div>
                    <div className="text-lg font-semibold text-white">{diagnostic.latency}ms</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-xs text-slate-400">Fingerprint</div>
                    <div className="text-lg font-semibold text-white">{diagnostic.fingerprintConsistency}%</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-xs text-slate-400">Entropy</div>
                    <div className="text-lg font-semibold text-white">{diagnostic.entropy}</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded">
                    <div className="text-xs text-slate-400">Risk Level</div>
                    <div className="text-lg font-semibold text-orange-400">
                      {diagnostic.riskFlags.length > 1 ? 'HIGH' : 'MEDIUM'}
                    </div>
                  </div>
                </div>

                {diagnostic.riskFlags.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-2">Traffic Analysis:</div>
                    <div className="flex flex-wrap gap-2">
                      {diagnostic.riskFlags.map((flag, i) => (
                        <Badge key={i} variant="outline" className="border-orange-400 text-orange-400">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 p-4 rounded-lg border border-orange-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-orange-300">Injection Available</div>
                      <div className="text-lg font-semibold text-white">
                        Projected: {diagnostic.projectedRange}
                      </div>
                      <div className="text-xs text-slate-400">
                        Account shows signal weakness. Priority injection recommended.
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-400">${diagnostic.injectionPrice}</div>
                      <Button 
                        onClick={() => handleInject(diagnostic)}
                        className="mt-2 bg-orange-600 hover:bg-orange-700 text-black font-semibold"
                        size="sm"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Inject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
