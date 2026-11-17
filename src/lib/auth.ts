import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type AppUser = { id: string; name: string; email: string; method: 'google' | 'email' | 'demo' }

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
/** Bez klíčů Supabase běží aplikace v testovacím režimu: účet a uložené závody jen v tomto prohlížeči. */
export const DEMO = !supabase

const LS_USER = 'startovka.demoUser'
const LS_SAVED = 'startovka.saved.'
const LS_PENDING = 'startovka.pendingSave'

function ls<T>(k: string, fallback: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function lsSet(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }
function lsDel(k: string) { try { localStorage.removeItem(k) } catch { /* ignore */ } }

export function setPendingSave(id: string | null) { if (id) lsSet(LS_PENDING, id); else lsDel(LS_PENDING) }
export function takePendingSave(): string | null { const v = ls<string | null>(LS_PENDING, null); lsDel(LS_PENDING); return v }

function toUser(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): AppUser {
  const meta = u.user_metadata || {}
  const email = u.email || ''
  const name = (meta.full_name as string) || (meta.name as string) || email.split('@')[0]
  const provider = (u.app_metadata?.provider as string) === 'google' ? 'google' : 'email'
  return { id: u.id, name, email, method: provider }
}

export async function currentUser(): Promise<AppUser | null> {
  if (!supabase) return ls<AppUser | null>(LS_USER, null)
  const { data } = await supabase.auth.getSession()
  return data.session ? toUser(data.session.user) : null
}

export function onAuthChange(cb: (u: AppUser | null) => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session ? toUser(session.user) : null))
  return () => data.subscription.unsubscribe()
}

export async function signInGoogle(): Promise<AppUser | null> {
  if (!supabase) {
    const u: AppUser = { id: 'demo-google', name: 'Testovací účet', email: 'test@gmail.com', method: 'demo' }
    lsSet(LS_USER, u); return u
  }
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  return null // přesměrování na Google
}

export async function signUpEmail(name: string, email: string, password: string): Promise<{ user: AppUser | null; info?: string; error?: string }> {
  if (!supabase) {
    const u: AppUser = { id: 'demo-' + email, name: name || email.split('@')[0], email, method: 'demo' }
    lsSet(LS_USER, u); return { user: u }
  }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: window.location.origin } })
  if (error) return { user: null, error: czError(error.message) }
  if (!data.session) return { user: null, info: 'Poslali jsme ti e-mail s potvrzovacím odkazem. Po potvrzení se přihlas.' }
  return { user: toUser(data.session.user) }
}

export async function signInEmail(email: string, password: string): Promise<{ user: AppUser | null; error?: string }> {
  if (!supabase) {
    const prev = ls<AppUser | null>(LS_USER, null)
    const u: AppUser = prev && prev.email === email ? prev : { id: 'demo-' + email, name: email.split('@')[0], email, method: 'demo' }
    lsSet(LS_USER, u); return { user: u }
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { user: null, error: czError(error.message) }
  return { user: data.user ? toUser(data.user) : null }
}

export async function resetPassword(email: string): Promise<string> {
  if (!supabase) return 'V testovacím režimu se e-maily neposílají.'
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
  return error ? czError(error.message) : 'Poslali jsme ti odkaz pro nastavení nového hesla.'
}

export async function signOut() {
  if (!supabase) { lsDel(LS_USER); return }
  await supabase.auth.signOut()
}

/* ---- Uložené závody ---- */
export async function loadSaved(u: AppUser): Promise<string[]> {
  if (!supabase) return ls<string[]>(LS_SAVED + u.email, [])
  const { data, error } = await supabase.from('saved_races').select('race_id').order('created_at')
  if (error) { console.warn(error); return [] }
  return (data || []).map((r: { race_id: string }) => r.race_id)
}

export async function setSaved(u: AppUser, raceId: string, on: boolean, all: string[]) {
  if (!supabase) { lsSet(LS_SAVED + u.email, all); return }
  if (on) await supabase.from('saved_races').upsert({ user_id: u.id, race_id: raceId }, { onConflict: 'user_id,race_id', ignoreDuplicates: true })
  else await supabase.from('saved_races').delete().eq('user_id', u.id).eq('race_id', raceId)
}

function czError(m: string): string {
  if (/invalid login credentials/i.test(m)) return 'Nesprávný e-mail nebo heslo.'
  if (/already registered/i.test(m)) return 'Tento e-mail už má účet – zkus se přihlásit.'
  if (/email not confirmed/i.test(m)) return 'E-mail ještě není potvrzený – podívej se do schránky.'
  if (/password/i.test(m) && /6|8|characters/i.test(m)) return 'Heslo je příliš krátké.'
  return m
}
