// supabase/functions/whatsapp-session-manager/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const WASENDER_API_URL = 'https://www.wasenderapi.com'
const ALLOWED_EMAIL = 'suplimenteoriginale@gmail.com'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged-in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user object to verify their identity
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check if the user has the allowed email
    if (user.email !== ALLOWED_EMAIL) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unauthorized - Only ${ALLOWED_EMAIL} can access this function`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Get WasenderAPI token from environment
    const wasenderToken = Deno.env.get('WASENDER_API_TOKEN')
    if (!wasenderToken) {
      throw new Error('WasenderAPI token not configured')
    }

    // Parse request body to check for action
    const requestBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const action = requestBody.action || 'check' // 'check' or 'disconnect'

    // Step 1: Get all WhatsApp sessions
    const sessionsResponse = await fetch(`${WASENDER_API_URL}/api/whatsapp-sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${wasenderToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!sessionsResponse.ok) {
      throw new Error(`Failed to fetch sessions: ${sessionsResponse.statusText}`)
    }

    const sessionsData = await sessionsResponse.json()
    console.log('Sessions data:', sessionsData)

    // Get the first session (or find the appropriate one)
    const sessions = sessionsData.data || []
    let session = sessions.length > 0 ? sessions[0] : null

    if (!session) {
      throw new Error('No WhatsApp session found')
    }

    const sessionId = session.id

    // Handle DISCONNECT action
    if (action === 'disconnect') {
      const disconnectResponse = await fetch(
        `${WASENDER_API_URL}/api/whatsapp-sessions/${sessionId}/disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${wasenderToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!disconnectResponse.ok) {
        const errorData = await disconnectResponse.json()
        console.error('Disconnect error:', errorData)
        throw new Error(`Failed to disconnect session: ${disconnectResponse.statusText}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'DISCONNECTED',
          sessionId: sessionId,
          message: 'WhatsApp session disconnected successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Step 2: Check if session is already connected
    if (session && session.status?.toLowerCase() === 'connected') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'CONNECTED',
          sessionId: session.id,
          sessionName: session.name || 'WhatsApp Session',
          phoneNumber: session.phone_number || null,
          createdAt: session.created_at || null,
          message: 'WhatsApp session is already connected',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Step 3: If not connected, initiate connection
    // Connect the session
    const connectResponse = await fetch(
      `${WASENDER_API_URL}/api/whatsapp-sessions/${sessionId}/connect`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wasenderToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!connectResponse.ok) {
      const errorData = await connectResponse.json()
      console.error('Connect error:', errorData)
      throw new Error(`Failed to connect session: ${connectResponse.statusText}`)
    }

    const connectData = await connectResponse.json()
    console.log('Connect response:', connectData)

    // Step 4: Get QR code
    const qrResponse = await fetch(
      `${WASENDER_API_URL}/api/whatsapp-sessions/${sessionId}/qrcode`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${wasenderToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!qrResponse.ok) {
      const errorData = await qrResponse.json()
      console.error('QR code error:', errorData)
      throw new Error(`Failed to get QR code: ${qrResponse.statusText}`)
    }

    const qrData = await qrResponse.json()
    console.log('QR code data:', qrData)

    // Step 5: Return QR code for scanning
    return new Response(
      JSON.stringify({
        success: true,
        status: qrData.data?.status || 'NEED_SCAN',
        sessionId: sessionId,
        sessionName: session.name || 'WhatsApp Session',
        phoneNumber: session.phone_number || null,
        createdAt: session.created_at || null,
        qrCode: qrData.data?.qrCode || null,
        message: 'Please scan the QR code to connect WhatsApp',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in whatsapp-session-manager:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
