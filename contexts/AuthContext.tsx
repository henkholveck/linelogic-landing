"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
  credits: number
  email_verified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name: string) => Promise<any>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_EMAILS = ['henkster91@gmail.com', 'monksb92@gmail.com']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false

  useEffect(() => {
    // Check for existing session
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          await refreshUser()
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { user: authUser } = await auth.getCurrentUser()
      if (authUser) {
        await refreshUser()
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const { user: authUser } = await auth.getCurrentUser()
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email || '',
          credits: authUser.user_metadata?.credits || 0,
          email_verified: authUser.email_confirmed_at !== null
        })
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await auth.signIn(email, password)
      if (result.data?.user) {
        await refreshUser()
      }
      return result
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    try {
      const result = await auth.signUp(email, password, name)
      return result
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      await auth.signOut()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    isLoading,
    isAdmin,
    signIn,
    signUp,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
