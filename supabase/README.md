# Supabase Setup Instructions

## Quick Setup (3 steps)

### Step 1: Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `migrations/20241129_initial_schema.sql`
5. Paste and click **Run**

This will:
- ✅ Create all database tables
- ✅ Set up indexes
- ✅ Enable Row Level Security
- ✅ Create RLS policies
- ✅ Insert sample data (3 shelters, 4 animals)

### Step 2: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it: `animal-images`
4. Make it **Public** ✓
5. Click **Create**

No policies needed for public bucket!

### Step 3: Verify Setup

Run this query in SQL Editor to check:

```sql
SELECT
  (SELECT COUNT(*) FROM public.shelters) as shelters_count,
  (SELECT COUNT(*) FROM public.animals) as animals_count;
```

Expected result:
- shelters_count: 3
- animals_count: 4

## That's it! 🎉

Your database is ready. Now run `npm run dev` and visit:
- http://localhost:3000 - Landing page
- http://localhost:3000/animals - See the 4 sample animals!

## Sample Data Included

### Shelters
- Hope Shelter (Bucharest)
- Pet House (Cluj-Napoca)
- Friend Shelter (Timișoara)

### Animals
- Max - Labrador dog (Hope Shelter)
- Luna - European cat (Hope Shelter)
- Rocky - Mixed breed dog (Pet House)
- Bella - Persian cat (Pet House)

## Troubleshooting

**Error: "relation already exists"**
- Tables already created. Skip to Step 2.

**No animals showing in /animals page?**
- Check `.env.local` has correct Supabase URL and key
- Verify seed data ran successfully
- Check browser console for errors

**RLS blocking access?**
- Make sure you're using Supabase anon key (not service role)
- RLS policies allow authenticated users to read all data

## Recreare bazei de date în contul tău Supabase (pași detallicați)

Dacă proiectul inițial e pe un cont care nu îți mai aparține, urmează pașii de mai jos ca să recreezi schema în contul tău Supabase și să actualizezi proiectul local.

1) Creare proiect Supabase
  - Intră la https://app.supabase.com și creează un proiect nou în contul tău.
  - După creare, notează **Project URL** și **anon public key** (le găsești la Settings → API).

2) Rulare migrații (două variante)
  - Variantă rapidă (recomandată): deschide Supabase Dashboard → SQL Editor → New Query. Copiază și rulează conținutul din `supabase/migrations/20241129_initial_schema.sql`. Apoi rulează separat celelalte fișiere din `supabase/migrations/` (de ex. `create_social_feed.sql`, `fix_rls.sql`, `fix_existing_admin.sql`) dacă e cazul.
  - Variantă CLI (opțional): instalează Supabase CLI (https://supabase.com/docs/guides/cli). Poți apoi să rulezi scripturi SQL local sau să folosești `supabase db push` dacă transformi SQL-urile într-un format de migrații compatibil. Această repo conține SQL-uri standalone; metoda sigură e rularea lor în SQL Editor.

3) Creează bucket-ul de storage
  - În Dashboard → Storage → New Bucket
  - Nume sugerat: `animal-images` (în SQL există referință la acest bucket)
  - Poți face bucket-ul public sau păstra privat și folosi signed urls; proiectul actual folosește URL-uri publice pentru imaginile de exemplu.

4) Actualizează variabilele de mediu local
  - Creează un fișier `.env.local` în root proiect (nu-l comite). Poți copia `.env.example` și completa:

    NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-public-anon-key>

  - După actualizare, repornește serverul de dev (de ex. `npm run dev`).

5) Elimină cheia existentă din repository (dacă a fost comisată)
  - Dacă `.env.local` sau cheia a fost pusă din greșeală în repository, scapă de ea din commit-uri urmând pașii:

    git rm --cached .env.local
    git commit -m "remove local env with secrets"
    git push

  - De asemenea rotirea cheilor se face din Dashboard → Settings → API → Rotate keys (recomandat dacă cheia publică a fost expusă).

6) Verificare după migrare
  - În SQL Editor rulează:

    SELECT
     (SELECT COUNT(*) FROM public.shelters) as shelters_count,
     (SELECT COUNT(*) FROM public.animals) as animals_count;

    Ar trebui să vezi numerele de seed (dacă ai rulat seed-ul din migrație).

7) Notă despre RLS și autentificare
  - Asigură-te că folosești cheia `anon` în client (NEXT_PUBLIC_SUPABASE_ANON_KEY). Cheia de tip "service_role" nu trebuie folosită în browser.
  - Dacă întâmpini probleme RLS, poți temporar dezactiva o politică sau ajusta policy-urile în SQL Editor, dar preferabil folosește migrațiile din repo care setează politicile corecte.

8) Pași opționali utili
  - Dacă vrei să păstrezi migrațiile aplicate în mod repeatable, consideră conversia SQL-urilor într-un folder `supabase/migrations/<timestamp>.sql` și folosește supabase CLI pentru a le aplica automat.
  - Adaugă `.env.local` în `.gitignore` (repo are deja `.env*.local` în .gitignore). Dacă ai comis chei, rotiri și `git rm --cached` sunt obligatorii.

Dacă vrei, pot:
 - să îți pregătesc un fișier `.env.example` (am adăugat acest fișier în repo)
 - să-ți scriu un checklist cu comenzile exacte pentru CLI (dacă vrei să folosești supabase CLI)

Spune-mi dacă vrei să te ajut pas-cu-pas: pot aștepta Project URL/Anon Key și apoi te pot ghida să actualizezi `.env.local` și să verificăm împreună că aplicația funcționează cu noul proiect.
