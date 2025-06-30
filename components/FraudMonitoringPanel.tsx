import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Users, 
  Activity,
  Eye,
  Clock
} from "lucide-react"
import { db } from "@/lib/supabase"

interface FraudAttempt {
  id: string
  ip_address: string
  email: string
  name: string
  user_agent: string
  fraud_type: string
  severity: string
  action_taken: string
  created_at: string
  metadata: any
}

interface BannedIP {
  id: string
  ip_address: string
  reason: string
  ban_type: string
  banned_by: string
  created_at: string
  expires_at: string | null
}

export function FraudMonitoringPanel() {
  const [fraudAttempts, setFraudAttempts] = useState<FraudAttempt[]>([])
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalAttempts: 0,
    bannedIPs: 0,
    todayAttempts: 0,
    criticalAttempts: 0
  })

  useEffect(() => {
    loadFraudData()
  }, [])

  const loadFraudData = async () => {
    setLoading(true)
    try {
      // Load fraud attempts (last 100)
      const { data: attempts, error: attemptsError } = await db.supabase
        .from('fraud_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!attemptsError && attempts) {
        setFraudAttempts(attempts)
      }

      // Load banned IPs
      const { data: banned, error: bannedError } = await db.supabase
        .from('banned_ips')
        .select('*')
        .order('created_at', { ascending: false })

      if (!bannedError && banned) {
        setBannedIPs(banned)
      }

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const todayAttempts = attempts?.filter(a => 
        a.created_at.startsWith(today)
      ).length || 0

      const criticalAttempts = attempts?.filter(a => 
        a.severity === 'critical'
      ).length || 0

      setStats({
        totalAttempts: attempts?.length || 0,
        bannedIPs: banned?.length || 0,
        todayAttempts,
        criticalAttempts
      })

    } catch (error) {
      console.error('Failed to load fraud data:', error)
    } finally {
      setLoading(false)
    }
  }

  const unbanIP = async (ipAddress: string) => {
    try {
      const { error } = await db.supabase
        .from('banned_ips')
        .delete()
        .eq('ip_address', ipAddress)

      if (!error) {
        setBannedIPs(prev => prev.filter(ip => ip.ip_address !== ipAddress))
      }
    } catch (error) {
      console.error('Failed to unban IP:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'banned': return 'bg-red-600'
      case 'blocked': return 'bg-orange-500'
      case 'flagged': return 'bg-yellow-500'
      case 'allowed': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Total Attempts</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-400 mb-2">
              <Ban className="h-4 w-4" />
              <span className="text-sm font-medium">Banned IPs</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.bannedIPs}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-400 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.todayAttempts}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-orange-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Critical</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.criticalAttempts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="attempts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800">
          <TabsTrigger value="attempts" className="text-white">Fraud Attempts</TabsTrigger>
          <TabsTrigger value="banned" className="text-white">Banned IPs</TabsTrigger>
        </TabsList>

        <TabsContent value="attempts" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Recent Fraud Attempts</CardTitle>
              <Button onClick={loadFraudData} disabled={loading} size="sm">
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fraudAttempts.map((attempt) => (
                  <div key={attempt.id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(attempt.severity)}>
                          {attempt.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getActionColor(attempt.action_taken)}>
                          {attempt.action_taken.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-slate-300 font-mono">
                          {attempt.ip_address}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(attempt.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <div className="text-white font-mono">{attempt.email || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Name:</span>
                        <div className="text-white">{attempt.name || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Type:</span>
                        <div className="text-white">{attempt.fraud_type}</div>
                      </div>
                    </div>

                    {attempt.user_agent && (
                      <div className="mt-2 text-xs text-slate-400">
                        <span>User Agent:</span> {attempt.user_agent}
                      </div>
                    )}
                  </div>
                ))}

                {fraudAttempts.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No fraud attempts recorded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banned" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Banned IP Addresses</CardTitle>
              <Button onClick={loadFraudData} disabled={loading} size="sm">
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bannedIPs.map((banned) => (
                  <div key={banned.id} className="bg-slate-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-red-600">BANNED</Badge>
                        <span className="text-lg text-white font-mono">
                          {banned.ip_address}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">
                          {new Date(banned.created_at).toLocaleString()}
                        </span>
                        <Button 
                          onClick={() => unbanIP(banned.ip_address)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          Unban
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="text-slate-400">Reason:</div>
                      <div className="text-white">{banned.reason}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Banned by: {banned.banned_by}
                      </div>
                    </div>
                  </div>
                ))}

                {bannedIPs.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No banned IP addresses
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
