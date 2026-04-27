import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const urlCandidates = [
  (process.env.SUPABASE_URL || '').trim(),
  (process.env.VITE_SUPABASE_URL || '').trim(),
];
const supabaseUrl = urlCandidates.find((u) => u && /^https?:\/\//i.test(u)) || '';
const supabaseServiceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const supabaseAdmin =
  supabaseUrl && supabaseServiceRole ? createClient(supabaseUrl, supabaseServiceRole) : null;
