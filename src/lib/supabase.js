import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// El estudiante entra con su código + PIN. Internamente usamos un correo ficticio.
export const codeToEmail = (code) => `${code.trim().toLowerCase()}@uyariy.app`
