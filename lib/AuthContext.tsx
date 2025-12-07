'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// Define the shape of our auth context
interface AuthContextType {
  user: User | null
  userRole: 'adopter' | 'shelter_admin' | null
  shelterId: string | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component that wraps the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'adopter' | 'shelter_admin' | null>(null)
  const [shelterId, setShelterId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user role and shelter data
  const fetchUserData = async (userId: string) => {
    try {
      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (userData) {
        setUserRole(userData.role)

        // If shelter admin, fetch their shelter
        if (userData.role === 'shelter_admin') {
          const { data: shelterData } = await supabase
            .from('shelters')
            .select('id')
            .eq('admin_id', userId)
            .single()

          setShelterId(shelterData?.id || null)
        } else {
          setShelterId(null)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  // Refresh user data (for after creating shelter)
  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.id)
    }
  }

  // Check if user is logged in on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes (login, logout, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserData(session.user.id)
      } else {
        setUserRole(null)
        setShelterId(null)
      }
    })

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [])

  // Sign up new user
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  // Sign out current user
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    userRole,
    shelterId,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
