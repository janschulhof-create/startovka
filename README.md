# Startovka – kalendář běžeckých závodů (testovací verze)

Vite + React + TypeScript, přihlášení přes Supabase (Google + e-mail).

## Spuštění lokálně
    npm install
    npm run dev

## Nasazení (GitHub → Vercel)
1. Nahraj složku do nového repozitáře na GitHubu (např. přes GitHub Desktop).
2. Na vercel.com → Add New → Project → vyber repozitář. Framework: Vite (detekuje se sám).
3. Deploy. Bez proměnných níže běží aplikace v testovacím režimu
   (účet a uložené závody jen v prohlížeči uživatele).

## Ostré přihlášení (Supabase)
1. Vytvoř projekt na supabase.com.
2. SQL Editor → spusť `supabase/schema.sql` (tabulka uložených závodů + zabezpečení).
3. Authentication → Providers: zapni Email a Google (Google vyžaduje OAuth klíč z Google Cloud Console).
4. Authentication → URL Configuration: Site URL = adresa na Vercelu.
5. Ve Vercelu → Settings → Environment Variables přidej
   `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY` (Project Settings → API v Supabase) a redeployni.

Data závodů: `src/data/races.ts` (stav 17. 11. 2026).
