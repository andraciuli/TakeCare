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
