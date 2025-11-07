
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key is not set in environment variables.')
    }

    // Auth check can be added here if needed
    
    const { name, interval, amount } = await req.json()

    if (!name || !interval || !amount) {
      throw new Error('Missing required parameters: name, interval, amount')
    }

    const response = await fetch('https://api.paystack.co/plan', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        interval,
        amount, // amount should be in kobo
      }),
    })

    const responseData = await response.json()

    if (!response.ok || !responseData.status) {
      console.error('Paystack API error:', responseData)
      throw new Error(responseData.message || 'Failed to create Paystack plan')
    }

    return new Response(JSON.stringify({ success: true, planCode: responseData.data.plan_code }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error creating Paystack plan:', error)
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
