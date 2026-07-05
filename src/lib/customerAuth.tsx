import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabaseCustomer } from './supabaseCustomer'

/**
 * Customer auth (Supabase Auth, public sign-up / login) — DEMO scope only.
 *
 * Deliberately separate from the admin `useAuth()` (src/lib/auth.tsx): it runs
 * on its own Supabase client (supabaseCustomer) with an isolated session store,
 * so customer sign-in never grants admin access. Shopping and booking flows do
 * NOT depend on this — it is purely additive.
 */
interface CustomerAuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  /** Display name from user_metadata.name, falling back to the email. */
  displayName: string | null
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null)

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabaseCustomer.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setSession(data.session ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setSession(null)
        setLoading(false)
      })

    const { data: sub } = supabaseCustomer.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<{ error: string | null; needsConfirmation: boolean }> {
    const { data, error } = await supabaseCustomer.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { error: error.message, needsConfirmation: false }
    // With email confirmation ON, signUp returns a user but NO session.
    return { error: null, needsConfirmation: !data.session }
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabaseCustomer.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  async function signOut(): Promise<void> {
    await supabaseCustomer.auth.signOut()
  }

  const user = session?.user ?? null
  const displayName = user
    ? ((user.user_metadata?.name as string | undefined) || user.email || null)
    : null

  const value: CustomerAuthContextValue = {
    session,
    user,
    loading,
    displayName,
    signUp,
    signIn,
    signOut,
  }

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  return ctx
}
