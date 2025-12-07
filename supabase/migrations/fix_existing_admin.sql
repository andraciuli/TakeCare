-- Fix existing users who should be shelter admins
-- Run this in Supabase SQL Editor if you already created an admin account

-- Option 1: Update a specific user by email
UPDATE public.users
SET role = 'shelter_admin'
WHERE email = 'your-admin-email@example.com';  -- Replace with your admin email

-- Option 2: View all users and their current roles
SELECT id, email, role FROM public.users;
