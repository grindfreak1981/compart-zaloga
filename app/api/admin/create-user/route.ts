import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { email, full_name, password, role, permissions } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Napaka' }, { status: 400 })
  }

  await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    email,
    full_name,
    role,
    permissions,
  })

  return NextResponse.json({ success: true })
}
