import { createClient } from '@supabase/supabase-js';

// Extracted project ref 'ppmieclusrppsvamvhku' from the anon token 'ref' claim
const SUPABASE_URL = 'https://ppmieclusrppsvamvhku.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbWllY2x1c3JwcHN2YW12aGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDExNTQsImV4cCI6MjA4MzA3NzE1NH0.dzVOhwnauTwOH7sS0PJqCe0GhPBDYkW95SKWY1zfbfQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);