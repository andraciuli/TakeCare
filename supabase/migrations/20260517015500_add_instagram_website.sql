-- Migration: Add instagram to shelters
-- Run this in your Supabase SQL Editor

ALTER TABLE public.shelters ADD COLUMN instagram TEXT;
