import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqppzzbpiprfeybpxszh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcHB6emJwaXByZmV5YnB4c3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMTc4NjMsImV4cCI6MjEwMzc5Mzg2M30.f3P5Pny6Hphrzb0IycporrgEf30OS_O58h8DLpKGLOI';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Client-side client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Admin-side client for Server Actions and Webhooks to bypass RLS or run elevated tasks
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
