import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, codeToEmail } from './lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [consented, setConsented] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
    const { data: c } = await supabase.from('consents').select('id').eq('user_id', userId).limit(1)
    setProfile(p)
    setConsented(!!c?.length)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      if (s) await loadProfile(s.user.id)
      else { setProfile(null); setConsented(false) }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = (code, pin) =>
    supabase.auth.signInWithPassword({ email: codeToEmail(code), password: pin })
  const signOut = () => supabase.auth.signOut()

  async function acceptConsent() {
    await supabase.from('consents').insert({ user_id: session.user.id, version: 'v1' })
    setConsented(true)
  }

  return (
    <AuthCtx.Provider value={{ session, profile, consented, loading, signIn, signOut, acceptConsent }}>
      {children}
    </AuthCtx.Provider>
  )
}
