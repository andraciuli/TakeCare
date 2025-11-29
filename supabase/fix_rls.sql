-- Fix RLS to allow public read access (for school project)
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public read access" ON public.animals;
DROP POLICY IF EXISTS "Public read access" ON public.shelters;

-- Create new policies that allow anonymous (public) read access
CREATE POLICY "Allow anonymous read" ON public.animals
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read" ON public.shelters
  FOR SELECT TO anon USING (true);

-- Also allow for authenticated users
CREATE POLICY "Allow authenticated read" ON public.animals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON public.shelters
  FOR SELECT TO authenticated USING (true);

-- Verify the policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('animals', 'shelters');
