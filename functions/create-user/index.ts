// supabase/functions/create-user/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify the requester is an admin
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user: adminUser } } = await supabaseClient.auth.getUser()
    if (!adminUser) throw new Error('Unauthorized')

    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', adminUser.id).single()
    if (profile?.role !== 'admin') throw new Error('Forbidden')

    // 2. Get the new user data from the request body
    const { email, password, full_name, role } = await req.json()
    if (!email || !password || !role) {
        throw new Error('Email, password, and role are required.')
    }

    // 3. Use the admin client to create the new user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Automatically confirm the user's email
    })

    if (createError) throw createError
    if (!newUser) throw new Error('User could not be created.')

    // 4. Create the user's profile (using upsert to handle duplicates)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.id,
        full_name: full_name,
        role: role,
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      // If profile creation fails, roll back by deleting the auth user
      console.error('Profile creation failed:', profileError)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(newUser.id)
      if (deleteError) {
        console.error('Rollback failed - could not delete user:', deleteError)
      }
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    return new Response(JSON.stringify({ user: newUser }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 400,
    })
  }
})
