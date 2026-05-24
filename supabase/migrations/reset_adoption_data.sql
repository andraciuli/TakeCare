-- Rulează acest script în Supabase SQL Editor pentru a reseta datele

-- 1. Șterge toate cererile de adopție
DELETE FROM public.adoption_requests;

-- 2. Resetează statusul tuturor animalelor înapoi la 'available'
UPDATE public.animals
SET status = 'available';
