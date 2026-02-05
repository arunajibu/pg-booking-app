import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkxtslzxyjceeotmcujx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreHRzbHp4eWpjZWVvdG1jdWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTMyNTQsImV4cCI6MjA4NTI4OTI1NH0.XQCGGjb-CEJxTurLuK9gJziarrUt5j9O-jexboT31Wc';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
