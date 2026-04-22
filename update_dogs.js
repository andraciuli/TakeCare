const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDogs() {
  const { data: dogs, error } = await supabase
    .from('animals')
    .select('*')
    .eq('species', 'dog')
    .limit(2);

  if (error) {
    console.error('Error fetching dogs:', error);
    return;
  }

  if (dogs.length < 2) {
    console.log('Need at least 2 dogs in the DB to update. Found:', dogs.length);
    return;
  }

  const desc1 = `Lili e un pui de cățel mic, dar cu idei mari și chef serios de viață. 
Curioasă, jucăușă și mereu în mișcare, explorează lumea cu entuziasm și un talent special de a transforma orice moment într-o joacă. 
E genul de cățel care nu are nevoie de mult ca să fie fericit — doar de oameni buni și o viață în care să crească frumos, alături de ei.`;

  const desc2 = `Peta este o cățelușă disponibilă pentru adopție. Mică, curioasă și cu mult chef de joacă, descoperă lumea pas cu pas și transformă orice moment într-o mică aventură. 
Caută o familie care să o iubească și să o ajute să crească frumos, în siguranță și cu multă răbdare.`;

  console.log(`Updating ${dogs[0].name} with Lili's description...`);
  await supabase.from('animals').update({ description: desc1, name: 'Lili' }).eq('id', dogs[0].id);

  console.log(`Updating ${dogs[1].name} with Peta's description...`);
  await supabase.from('animals').update({ description: desc2, name: 'Peta' }).eq('id', dogs[1].id);

  console.log('Successfully updated the dogs!');
}

updateDogs();
