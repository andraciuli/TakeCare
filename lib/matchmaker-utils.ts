/**
 * Calculates the heuristic compatibility score (0-100) between an adopter preferences form
 * and an animal profile.
 */
export function calculateHeuristicScore(form: any, animal: any): number {
  let score = 50; // Base score
  
  // Species match
  if (form.species && form.species !== 'No preference') {
    const animalSpecies = (animal.species || '').toLowerCase();
    const formSpecies = form.species.toLowerCase();
    if (animalSpecies === formSpecies) {
      score += 40;
    } else {
      score -= 50; // Severe penalty for wrong species
    }
  }

  // Age match
  if (animal.age !== null && animal.age !== undefined) {
    if (form.agePref === 'Puppy/Kitten' && animal.age < 1) score += 10;
    if (form.agePref === 'Young' && animal.age >= 1 && animal.age <= 3) score += 10;
    if (form.agePref === 'Adult' && animal.age > 3 && animal.age <= 7) score += 10;
    if (form.agePref === 'Senior' && animal.age > 7) score += 10;
  }

  // Breed preference
  if (form.breedPref && animal.breed) {
    if (animal.breed.toLowerCase().includes(form.breedPref.toLowerCase())) {
      score += 15;
    }
  }

  // Cap between 0 and 100
  return Math.max(0, Math.min(100, score));
}
