-- Add visit_date and visit_message columns to adoption_requests table
ALTER TABLE public.adoption_requests ADD COLUMN IF NOT EXISTS visit_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.adoption_requests ADD COLUMN IF NOT EXISTS visit_message TEXT;
