-- TakeCare Database Schema
-- Run this entire file in Supabase SQL Editor

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL CHECK (role IN ('adopter', 'shelter_admin')) DEFAULT 'adopter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shelters table
CREATE TABLE public.shelters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  schedule TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Animals table
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelter_id UUID NOT NULL REFERENCES public.shelters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  sex TEXT CHECK (sex IN ('male', 'female', 'unknown')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'adopted')),
  image_url TEXT[],
  characteristics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adoption requests table
CREATE TABLE public.adoption_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, animal_id)
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_animals_shelter ON public.animals(shelter_id);
CREATE INDEX idx_animals_status ON public.animals(status);
CREATE INDEX idx_animals_species ON public.animals(species);
CREATE INDEX idx_adoption_requests_user ON public.adoption_requests(user_id);
CREATE INDEX idx_adoption_requests_animal ON public.adoption_requests(animal_id);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_shelters_location ON public.shelters(latitude, longitude);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Users policies
CREATE POLICY "Public read access" ON public.users
  FOR SELECT TO authenticated USING (true);

-- Shelters policies
CREATE POLICY "Public read access" ON public.shelters
  FOR SELECT TO authenticated USING (true);

-- Animals policies
CREATE POLICY "Public read access" ON public.animals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all operations" ON public.animals
  FOR ALL TO authenticated USING (true);

-- Adoption requests policies
CREATE POLICY "Public read access" ON public.adoption_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all operations" ON public.adoption_requests
  FOR ALL TO authenticated USING (true);

-- Favorites policies
CREATE POLICY "Public read access" ON public.favorites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all operations" ON public.favorites
  FOR ALL TO authenticated USING (true);

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

-- Insert sample shelters
INSERT INTO public.shelters (name, address, phone, email, latitude, longitude, description, schedule) VALUES
  ('Hope Shelter', '10 Plopilor Street, Bucharest', '0712345678', 'contact@hopeshelter.ro', 44.4268, 26.1025, 'Shelter for abandoned dogs and cats in Bucharest', 'Mon-Fri: 9:00-17:00, Sat-Sun: 10:00-14:00'),
  ('Pet House', '25 Florilor Street, Cluj-Napoca', '0723456789', 'info@pethouse.ro', 46.7712, 23.6236, 'Animal resocialization and adoption center in Cluj', 'Mon-Sun: 10:00-18:00'),
  ('Friend Shelter', '15 Magheru Blvd, Timisoara', '0734567890', 'friend@shelter.ro', 45.7489, 21.2087, 'Modern shelter with complete facilities', 'Mon-Fri: 8:00-18:00, Sat: 9:00-15:00');

-- Insert sample animals
INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, characteristics)
SELECT
  s.id,
  'Max',
  'dog',
  'Labrador',
  3,
  'male',
  'Friendly and energetic dog, perfect for families with children',
  'available',
  '{"vaccinated": true, "sterilized": true, "sociable": true, "good_with_kids": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Hope Shelter' LIMIT 1;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, characteristics)
SELECT
  s.id,
  'Luna',
  'cat',
  'European',
  2,
  'female',
  'Calm and affectionate cat, ideal for apartments',
  'available',
  '{"vaccinated": true, "sterilized": true, "sociable": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Hope Shelter' LIMIT 1;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, characteristics)
SELECT
  s.id,
  'Rocky',
  'dog',
  'Mixed',
  5,
  'male',
  'Loyal and protective dog with training experience',
  'available',
  '{"vaccinated": true, "sterilized": false, "trained": true, "active": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Pet House' LIMIT 1;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, characteristics)
SELECT
  s.id,
  'Bella',
  'cat',
  'Persian',
  1,
  'female',
  'Young, playful and curious cat',
  'available',
  '{"vaccinated": true, "sterilized": true, "playful": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Pet House' LIMIT 1;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your database is now ready to use.
-- Don't forget to create the 'animal-images' storage bucket in Supabase Storage!
