-- Migration: Add gallery_urls to shelters
-- Run this in your Supabase SQL Editor

ALTER TABLE public.shelters ADD COLUMN gallery_urls TEXT[];
