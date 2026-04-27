/**
 * Flutterwave Payments Edge Function
 * Handles payment initialization, verification, and refunds server-side.
 * Keeps FLUTTERWAVE_SECRET_KEY out of the frontend.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
const FLUTTERWAVE_BASE_URL =
  Deno.env.get('FLUTTERWAVE_BASE_URL') || 'https://api.flutterwave.com/v3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!FLUTTERWAVE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: 'Flutterwave is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
      'resolve_account',
      'list_banks',
      'transfer',
      'verify_transfer',
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

    const headers = {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };

    if (action === 'initialize') {
      const {
        email,
        amount,
        tx_ref,
        redirect_url,
        currency,
        customer_name,
        customer_phone,
        customizations,
        meta,
      } = body;

      if (!email || !amount) {
        return new Response(
          JSON.stringify({ success: false, error: 'email and amount are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const reference =
        tx_ref || `FLW_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

      const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tx_ref: reference,
          amount: Number(amount),
          currency: currency || 'NGN',
          redirect_url: redirect_url || undefined,
          customer: {
            email,
            name: customer_name || email,
            phone_number: customer_phone,
          },
          customizations: customizations || {
            title: 'DamianixPro Payment',
            description: meta?.description || 'Payment',
          },
          meta: meta || {},
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

      // Flutterwave verify by reference
      const response = await fetch(
        `${FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
        { method: 'GET', headers }
      );

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'resolve_account') {
      const { account_number, account_bank, bank_code } = body;
      const accNum = account_number;
      const bank = account_bank || bank_code;
      if (!accNum || !bank) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'account_number and account_bank (or bank_code) are required',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`${FLUTTERWAVE_BASE_URL}/accounts/resolve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ account_number: accNum, account_bank: bank }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        return new Response(
          JSON.stringify({
            status: true,
            data: {
              account_name: data.data.account_name,
              account_number: data.data.account_number,
              bank_code: bank,
            },
            message: data.message,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          status: false,
          message: data.message || data.error || 'Account resolution failed',
          data: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'list_banks') {
      const country = body.country || 'NG';
      const response = await fetch(`${FLUTTERWAVE_BASE_URL}/banks?country=${country}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        const banks = Array.isArray(data.data) ? data.data : [];
        return new Response(
          JSON.stringify({
            status: true,
            data: banks.map((b: { name?: string; code?: string }) => ({
              name: b.name,
              code: b.code,
            })),
            message: data.message,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          status: false,
          message: data.message || 'Failed to fetch banks',
          data: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'transfer') {
      const { account_bank, account_number, amount, currency, narration, reference } = body;
      const bankCode = account_bank || body.bank_code;
      if (!bankCode || !account_number || !amount) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'account_bank, account_number, and amount are required',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const ref =
        reference || `FW_TRF_${Date.now()}_${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
      const curr = currency || 'NGN';

      const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transfers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          account_bank: bankCode,
          account_number,
          amount: Number(amount),
          currency: curr,
          debit_currency: curr,
          narration: narration || 'Payout',
          reference: ref,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        const d = data.data;
        return new Response(
          JSON.stringify({
            status: true,
            data: {
              id: d.id,
              transfer_id: d.id,
              reference: d.reference || ref,
            },
            message: data.message,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          status: false,
          message: data.message || data.error || 'Transfer failed',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'verify_transfer') {
      const { transfer_id, id } = body;
      const tid = transfer_id || id;
      if (!tid) {
        return new Response(JSON.stringify({ success: false, error: 'transfer_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetch(`${FLUTTERWAVE_BASE_URL}/transfers/${tid}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        const status = (data.data.status || '').toLowerCase();
        const mappedStatus =
          status === 'successful' ? 'success' : status === 'failed' ? 'failed' : 'pending';
        return new Response(
          JSON.stringify({
            status: true,
            data: { status: mappedStatus },
            message: data.message,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ status: false, message: data.message || 'Transfer verification failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (action === 'refund') {
      const { transaction_reference, amount, comments } = body;
      if (!transaction_reference) {
        return new Response(
          JSON.stringify({ success: false, error: 'transaction_reference is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const refundBody: Record<string, unknown> = {
        comments: comments || 'Refund request',
      };
      if (amount) refundBody.amount = amount;

      const response = await fetch(
        `${FLUTTERWAVE_BASE_URL}/transactions/${transaction_reference}/refund`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(refundBody),
        }
      );

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
    console.error('Flutterwave payments error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
