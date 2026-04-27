/**
 * Paystack Payments Edge Function
 * Handles payment initialization, verification, and refunds server-side.
 * Keeps PAYSTACK_SECRET_KEY out of the frontend.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const PAYSTACK_BASE_URL = Deno.env.get('PAYSTACK_BASE_URL') || 'https://api.paystack.co';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'Paystack is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || req.headers.get('x-action');
    const validActions = [
      'initialize',
      'verify',
      'refund',
      'create_recipient',
      'transfer',
      'verify_transfer',
      'list_banks',
      'resolve_account',
    ];

    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid action. Use: ${validActions.join(' | ')}`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'initialize') {
      const { email, amount, reference, callback_url, currency, metadata } = body;
      if (!email || !amount) {
        return new Response(
          JSON.stringify({ success: false, error: 'email and amount are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100),
          reference:
            reference ||
            `PAY_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
          callback_url: callback_url || undefined,
          currency: currency || 'NGN',
          metadata: metadata || {},
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'verify') {
      const { reference } = body;
      if (!reference) {
        return new Response(JSON.stringify({ success: false, error: 'reference is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'verify_transfer') {
      const { transfer_code } = body;
      if (!transfer_code) {
        return new Response(JSON.stringify({ success: false, error: 'transfer_code required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const response = await fetch(`${PAYSTACK_BASE_URL}/transfer/${transfer_code}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'resolve_account') {
      const { account_number, bank_code } = body;
      if (!account_number || !bank_code) {
        return new Response(
          JSON.stringify({ success: false, error: 'account_number and bank_code required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const response = await fetch(
        `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'list_banks') {
      const country = body.country || 'NG';
      const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=${country}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'create_recipient') {
      const { type, name, account_number, bank_code, currency, description } = body;
      if (!type || !name || !account_number || !bank_code) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'type, name, account_number, bank_code required',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type || 'nuban',
          name,
          account_number,
          bank_code,
          currency: currency || 'NGN',
          description: description || '',
        }),
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'transfer') {
      const { recipient, amount, reason, reference, currency } = body;
      if (!recipient || !amount) {
        return new Response(
          JSON.stringify({ success: false, error: 'recipient and amount required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          recipient,
          amount: Math.round(amount * 100),
          reason: reason || 'Payout',
          reference: reference || `TRF_${Date.now()}`,
          currency: currency || 'NGN',
        }),
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'refund') {
      const { transaction_reference, amount, currency, customer_note, merchant_note } = body;
      if (!transaction_reference) {
        return new Response(
          JSON.stringify({ success: false, error: 'transaction_reference is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refundBody: Record<string, unknown> = {
        transaction: transaction_reference,
        currency: currency || 'NGN',
      };
      if (amount) refundBody.amount = Math.round(amount * 100);
      if (customer_note) refundBody.customer_note = customer_note;
      if (merchant_note) refundBody.merchant_note = merchant_note;

      const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundBody),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Paystack payments error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
