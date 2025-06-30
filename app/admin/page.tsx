"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  CreditCard, 
  Clock, 
  MessageCircle, 
  Settings,
  Search,
  Plus,
  Minus,
  UserCheck,
  Calendar,
  DollarSign
} from "lucide-react"
import { db } from "@/lib/supabase"

interface UserProfile {
  id: string
  email: string
  name: string
  credits: number
  email_verified: boolean
  created_at: string
  updated_at: string
}

interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: 'added' | 'spent'
  reason: string
  admin_email: string
  created_at: string
}

interface PaymentReceipt {
  id: string
  user_id: string
  payment_type: string
  service_type: string
  amount: number
  receipt_id: string
  status: string
  created_at: string
}

export default function AdminPage() {
  // Auth check
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [loading, setLoading] = useState(true)

  // Data
  const [users, setUsers] = useState<UserProfile[]>([])
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([])
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // UI state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditReason, setCreditReason] = useState("")
  const [showChatbot, setShowChatbot] = useState(false)

  const ADMIN_EMAILS = ["henkster91@gmail.com", "monksb92@gmail.com"]

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      // In a real app, you'd check the user's auth session
      // For now, we'll use a simple email check
      const email = prompt("Enter your admin email:")
      if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
        setIsAdmin(true)
        setAdminEmail(email)
        await loadData()
      } else {
        alert("Access denied. Admin privileges required.")
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Admin access check failed:", error)
      window.location.href = "/"
    }
    setLoading(false)
  }

  const loadData = async () => {
    try {
      // Load users
      const { data: usersData, error: usersError } = await db.getAllUsers()
      if (!usersError && usersData) {
        setUsers(usersData)
      }

      // Load payment receipts
      const { data: receiptsData, error: receiptsError } = await db.getAllPaymentReceipts()
      if (!receiptsError && receiptsData) {
        setPaymentReceipts(receiptsData)
      }
    } catch (error) {
      console.error("Failed to load admin data:", error)
    }
  }

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount || !creditReason) {
      alert("Please fill in all fields")
      return
    }

    try {
      const amount = parseInt(creditAmount)
      const newCredits = selectedUser.credits + amount

      // Update user credits
      await db.updateUserCredits(selectedUser.id, newCredits)

      // Log the transaction
      await db.logCreditTransaction({
        userId: selectedUser.id,
        amount: amount,
        type: 'added',
        reason: creditReason,
        adminEmail: adminEmail
      })

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, credits: newCredits, updated_at: new Date().toISOString() }
          : u
      ))

      setSelectedUser({ ...selectedUser, credits: newCredits })
      setCreditAmount("")
      setCreditReason("")
      
      alert(`Successfully added ${amount} credits to ${selectedUser.email}`)
    } catch (error) {
      console.error("Failed to add credits:", error)
      alert("Failed to add credits. Please try again.")
    }
  }

  const handleVerifyPayment = async (receiptId: string, creditsToAdd: number) => {
    try {
      const receipt = paymentReceipts.find(r => r.id === receiptId)
      if (!receipt) return

      // Update receipt status
      await db.updatePaymentReceiptStatus(receiptId, 'verified', adminEmail)

      // Add credits to user
      const user = users.find(u => u.id === receipt.user_id)
      if (user) {
        const newCredits = user.credits + creditsToAdd
        await db.updateUserCredits(user.id, newCredits)
        
        // Log transaction
        await db.logCreditTransaction({
          userId: user.id,
          amount: creditsToAdd,
          type: 'added',
          reason: `Payment verified: ${receipt.payment_type} ${receipt.receipt_id}`,
          adminEmail: adminEmail
        })

        // Update local state
        setUsers(users.map(u => 
          u.id === user.id 
            ? { ...u, credits: newCredits, updated_at: new Date().toISOString() }
            : u
        ))
      }

      // Update receipts
      setPaymentReceipts(paymentReceipts.map(r =>
        r.id === receiptId
          ? { ...r, status: 'verified' }
          : r
      ))

      alert("Payment verified and credits added!")
    } catch (error) {
      console.error("Failed to verify payment:", error)
      alert("Failed to verify payment. Please try again.")
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingReceipts = paymentReceipts.filter(r => r.status === 'pending_verification')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">Admin privileges required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">LineLogic Admin</h1>
              <p className="text-gray-600">Welcome, {adminEmail}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowChatbot(!showChatbot)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Support Chat</span>
              </Button>
              <Button
                onClick={() => window.location.href = "/queue-testing"}
                variant="outline"
              >
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payments ({pendingReceipts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Management</span>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.credits >= 5 ? "default" : "destructive"}>
                              {user.credits} credits
                            </Badge>
                            {user.email_verified && (
                              <Badge variant="outline" className="text-green-600">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Last updated: {new Date(user.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Credit Management */}
            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Credits for {selectedUser.email}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Credit Amount
                      </label>
                      <Input
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="Enter amount (e.g., 50)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason
                      </label>
                      <Input
                        value={creditReason}
                        onChange={(e) => setCreditReason(e.target.value)}
                        placeholder="e.g., Payment verified, Bonus credits"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddCredits} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credits
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Payment Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingReceipts.map((receipt) => {
                    const user = users.find(u => u.id === receipt.user_id)
                    return (
                      <div key={receipt.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user?.email || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {receipt.payment_type.toUpperCase()} - ${receipt.amount}
                            </div>
                            <div className="text-sm text-gray-500">
                              Receipt ID: {receipt.receipt_id}
                            </div>
                            <div className="text-xs text-gray-400">
                              Submitted: {new Date(receipt.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Credits to add"
                              className="w-32"
                              id={`credits-${receipt.id}`}
                            />
                            <Button
                              onClick={() => {
                                const input = document.getElementById(`credits-${receipt.id}`) as HTMLInputElement
                                const credits = parseInt(input.value)
                                if (credits > 0) {
                                  handleVerifyPayment(receipt.id, credits)
                                } else {
                                  alert("Please enter a valid credit amount")
                                }
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Verify
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {pendingReceipts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No pending payment verifications
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {users.reduce((sum, user) => sum + user.credits, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{pendingReceipts.length}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Simple Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Support Chat</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChatbot(false)}
            >
              ×
            </Button>
          </div>
          <div className="p-4 h-64 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm">Hi! I'm the LineLogic support bot. How can I help you today?</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm">For urgent issues, please contact:</p>
                <p className="text-sm font-semibold">Rich: monksb92@gmail.com</p>
                <p className="text-sm font-semibold">Henk: henkster91@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <Input placeholder="Type your message..." />
          </div>
        </div>
      )}
    </div>
  )
}
