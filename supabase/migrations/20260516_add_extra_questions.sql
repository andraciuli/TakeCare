-- Add extra_questions to animals
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS extra_questions JSONB DEFAULT '[]'::jsonb;

-- Add extra_answers to adoption_requests
ALTER TABLE public.adoption_requests ADD COLUMN IF NOT EXISTS extra_answers JSONB DEFAULT '{}'::jsonb;
