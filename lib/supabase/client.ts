import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

// This is a workaround for the "document is not defined" error during SSR
type CookieOptions = {
  name: string
  value: string
  domain?: string
  maxAge?: number
  path?: string
  sameSite?: string
  secure?: boolean
  httpOnly?: boolean
}

const safeGetCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return undefined
}

const safeSetCookie = ({ name, value, ...options }: CookieOptions): void => {
  if (typeof document === 'undefined') return
  
  const cookieOptions = [
    `path=${options.path || '/'}`,
    options.domain ? `domain=${options.domain}` : '',
    options.maxAge ? `max-age=${options.maxAge}` : '',
    options.sameSite ? `SameSite=${options.sameSite}` : 'SameSite=lax',
    options.secure ? 'Secure' : '',
    options.httpOnly ? 'HttpOnly' : ''
  ].filter(Boolean).join('; ')
  
  document.cookie = `${name}=${value}; ${cookieOptions}`
}

const safeRemoveCookie = (name: string, options: Omit<CookieOptions, 'name' | 'value'>): void => {
  if (typeof document === 'undefined') return
  safeSetCookie({
    name,
    value: '',
    ...options,
    maxAge: -1
  })
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development',
    },
    cookies: {
      get: safeGetCookie,
      set: (name, value, options) => {
        safeSetCookie({
          name,
          value,
          ...options,
          secure: options?.secure,
          sameSite: options?.sameSite as 'lax' | 'strict' | 'none' | undefined,
          httpOnly: options?.httpOnly,
        })
      },
      remove: (name, options) => {
        safeRemoveCookie(name, {
          ...options,
          secure: options?.secure,
          sameSite: options?.sameSite as 'lax' | 'strict' | 'none' | undefined,
          httpOnly: options?.httpOnly,
        })
      },
    },
  })
}

// Create a single supabase client for interacting with your database
export const supabase = createClient()
