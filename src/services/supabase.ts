import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://curqipbwksoeqyzfouvp.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cnFpcGJ3a3NvZXF5emZvdXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1ODk3NjgsImV4cCI6MjEwNDE2NTc2OH0.g4WIG7JCEG52aoY6CpqTCtUJy_V6iXNBex-_f5slaZU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
