-- Script SQL pentru popularea tabelei `animals` cu mai multe animale de test
-- Asigură-te că ai adăposturi deja create în baza de date (ex: 'Hope Shelter', 'Pet House', 'Friend Shelter')
-- Rulează acest cod în SQL Editor-ul din Supabase

-- Adăugare câini și pisici pentru "Hope Shelter"
INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  s.id, 
  'Bruno', 
  'dog', 
  'Ciobănesc German', 
  4, 
  'male', 
  'Bruno este un câine inteligent, alert și extrem de loial. A fost salvat dintr-o zonă industrială și are nevoie de o curte unde să își consume energia. Se înțelege bine cu adulții, dar necesită o introducere lentă cu alte animale.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1589924691995-400dc9cecb58?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "good_with_kids": false, "active": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Hope Shelter' LIMIT 1;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  s.id, 
  'Milo', 
  'cat', 
  'Siameză', 
  1, 
  'male', 
  'Milo este un motănel foarte vocal și iubitor de atenție. Adoră să doarmă pe calorifer și să privească pe fereastră. Este perfect pentru apartament.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "playful": true, "indoor_only": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Hope Shelter' LIMIT 1;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  s.id, 
  'Daisy', 
  'dog', 
  'Beagle', 
  2, 
  'female', 
  'O fetiță Beagle foarte prietenoasă, mereu cu nasul pe pământ. Are nevoie de multă mișcare și de stăpâni care au experiență cu această rasă.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1537151608804-ea2f0c749032?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "good_with_kids": true, "vocal": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Hope Shelter' LIMIT 1;


-- Adăugare câini și pisici pentru "Pet House"
INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  s.id, 
  'Oliver', 
  'cat', 
  'British Shorthair', 
  3, 
  'male', 
  'Oliver este un motan masiv, liniștit și cu un comportament aristocratic. Nu face mofturi la mâncare, dar apreciază spațiul lui.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "calm": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Pet House' LIMIT 1;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  s.id, 
  'Charlie', 
  'dog', 
  'Golden Retriever mix', 
  1, 
  'male', 
  'Un puiandru plin de viață care iubește pe toată lumea. Mai are de lucrat la mersul în lesă, dar e foarte receptiv la dresaj pozitiv.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": false, "dewormed": true, "good_with_kids": true, "playful": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Pet House' LIMIT 1;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  s.id, 
  'Maya', 
  'dog', 
  'Husky Siberian', 
  5, 
  'female', 
  'Superbă, activă și vocală. Maya este un câine excepțional pentru cineva pasionat de drumeții montane.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "active": true, "requires_yard": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Pet House' LIMIT 1;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  s.id, 
  'Simba', 
  'cat', 
  'Europeană (Roșcat)', 
  0, 
  'male', 
  'Un puiuț găsit abandonat într-o cutie. Acum e perfect sănătos și abia așteaptă să toarcă în brațele cuiva.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": false, "sterilized": false, "dewormed": true, "good_with_kids": true}'::jsonb
FROM public.shelters s WHERE s.name = 'Pet House' LIMIT 1;


-- Adăugare câini și pisici pentru "Friend Shelter" sau orice alt adăpost
-- Aici folosim un sub-query general pentru primul adăpost găsit (în caz că numele diferă)
INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  (SELECT id FROM public.shelters LIMIT 1 OFFSET 0), 
  'Rex', 
  'dog', 
  'Metis (Talie Medie)', 
  6, 
  'male', 
  'Rex e veteranul nostru. A fost salvat dintr-un lanț foarte scurt. Are nevoie de o familie răbdătoare, care să-i ofere o pensie liniștită.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "calm": true, "special_needs": false}'::jsonb;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  (SELECT id FROM public.shelters LIMIT 1 OFFSET 1), 
  'Cleo', 
  'cat', 
  'Calico', 
  2, 
  'female', 
  'Cleo este o pisică independentă, care îți arată afecțiune doar în termenii ei. Perfectă pentru o persoană ocupată.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "independent": true}'::jsonb;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  (SELECT id FROM public.shelters LIMIT 1 OFFSET 0), 
  'Toby', 
  'dog', 
  'Corgi mix', 
  2, 
  'male', 
  'Un cățel adorabil cu picioare scurte și urechi imense. Foarte jucăuș, adoră mingea și recompensele.', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "playful": true}'::jsonb;

INSERT INTO public.animals (shelter_id, name, species, breed, age, sex, description, status, image_url, characteristics)
SELECT 
  (SELECT id FROM public.shelters LIMIT 1 OFFSET 1), 
  'Nala', 
  'cat', 
  'Sfinx', 
  4, 
  'female', 
  'O pisică extrem de iubitoare care are nevoie de căldură. Datorită rasei, are nevoie de îngrijire specială (băi frecvente).', 
  'available', 
  ARRAY['https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=800'],
  '{"vaccinated": true, "sterilized": true, "dewormed": true, "special_care": true}'::jsonb;
