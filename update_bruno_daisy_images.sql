-- Update image for Bruno (German Shepherd / Ciobănesc German)
UPDATE animals 
SET image_url = array['https://images.unsplash.com/photo-1589924691995-400dc9cecb58?auto=format&fit=crop&q=80&w=800']
WHERE name = 'Bruno';

-- Update image for Daisy (Beagle)
UPDATE animals 
SET image_url = array['https://images.unsplash.com/photo-1537151608804-ea2f0c749032?auto=format&fit=crop&q=80&w=800']
WHERE name = 'Daisy';
