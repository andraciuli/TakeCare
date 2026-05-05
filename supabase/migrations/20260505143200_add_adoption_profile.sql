-- Add adoption_profile JSONB column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS adoption_profile JSONB DEFAULT '{}'::jsonb;
