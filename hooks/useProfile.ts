import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/lib/permissions'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log("SESSION:", session)
        if (!session?.user) { setLoading(false); return }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log("PROFILE DATA:", data, error)
        setProfile(data)
        setLoading(false)
      } catch (e) {
        console.log("PROFILE ERROR:", e)
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  return { profile, loading }
}
