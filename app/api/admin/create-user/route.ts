import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { username, full_name, password, role, permissions } = await req.json()
  const email = `${username.trim().toLowerCase()}@compart.local`

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || username },
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Napaka pri ustvarjanju userja' }, { status: 400 })
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: data.user.id,
      full_name: full_name || username,
      role: role,
      permissions: permissions || {},
    }, { onConflict: 'id' })

  if (profileError) {
    // Pobriši userja če profil ni uspel
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    return NextResponse.json({ error: 'Profil napaka: ' + profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
