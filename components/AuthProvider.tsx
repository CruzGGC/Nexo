'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export type Profile = Database['public']['Tables']['profiles']['Row']

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshingProfile: boolean
  isGuest: boolean
  signInAsGuest: () => Promise<void>
  continueWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(userId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return data ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshingProfile, setRefreshingProfile] = useState(false)

  useEffect(() => {
    let isMounted = true

    const getInitialSession = async () => {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(data.session)
      if (data.session?.user) {
        const nextProfile = await fetchProfile(data.session.user.id)
        if (!isMounted) return
        setProfile(nextProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    getInitialSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user) {
        const nextProfile = await fetchProfile(nextSession.user.id)
        setProfile(nextProfile)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const ensureProfile = async (userId: string) => {
    setRefreshingProfile(true)
    try {
      const nextProfile = await fetchProfile(userId)
      setProfile(nextProfile)
    } finally {
      setRefreshingProfile(false)
    }
  }

  const signInAsGuest = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        await ensureProfile(data.session.user.id)
      }
    } finally {
      setLoading(false)
    }
  }

  const continueWithGoogle = async () => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined

    if (session?.user?.is_anonymous) {
      const { error } = await supabase.auth.linkIdentity({ provider: 'google' })
      if (error) throw error
      if (session.user) {
        await ensureProfile(session.user.id)
      }
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
    setSession(null)
  }

  const refreshProfile = async () => {
    if (!session?.user) return
    await ensureProfile(session.user.id)
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshingProfile,
    isGuest: Boolean(profile?.is_anonymous ?? session?.user?.is_anonymous),
    signInAsGuest,
    continueWithGoogle,
    signOut: handleSignOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
