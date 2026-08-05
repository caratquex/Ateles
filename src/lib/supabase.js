import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ofkwacswfqfvusyhoqlm.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jEIYvwgQrbSE4COJQ29w5g_SAdLBDXp"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
