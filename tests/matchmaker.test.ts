import { calculateHeuristicScore } from '@/lib/matchmaker-utils';

describe('calculateHeuristicScore', () => {
  test('should return 100 for perfect match (correct species, age category, and matching breed)', () => {
    const form = {
      species: 'Dog',
      agePref: 'Young',
      breedPref: 'Labrador'
    };
    const animal = {
      species: 'dog',
      age: 2, // young is 1 to 3 years
      breed: 'Labrador Retriever'
    };
    // Base 50 + Species 40 + Age 10 + Breed 15 = 115, capped at 100
    const score = calculateHeuristicScore(form, animal);
    expect(score).toBe(100);
  });

  test('should deduct 50 points and score <= 10 if species mismatches', () => {
    const form = {
      species: 'Cat',
      agePref: 'Adult'
    };
    const animal = {
      species: 'dog',
      age: 4,
      breed: 'Husky'
    };
    // Base 50 - Species 50 + Age 10 = 10
    const score = calculateHeuristicScore(form, animal);
    expect(score).toBeLessThanOrEqual(10);
  });

  test('should not apply species penalty if user preference is "No preference"', () => {
    const form = {
      species: 'No preference',
      agePref: 'Senior'
    };
    const animal = {
      species: 'dog',
      age: 9, // senior > 7
      breed: 'Beagle'
    };
    // Base 50 + no species check + Age 10 = 60
    const score = calculateHeuristicScore(form, animal);
    expect(score).toBe(60);
  });

  test('should award age bonus if age falls into user category preference', () => {
    const form = {
      species: 'Dog',
      agePref: 'Puppy/Kitten'
    };
    const puppy = {
      species: 'dog',
      age: 0.5 // < 1
    };
    const adult = {
      species: 'dog',
      age: 4 // >= 3 && <= 7
    };

    // Puppy: Base 50 + Species 40 + Age 10 = 100
    expect(calculateHeuristicScore(form, puppy)).toBe(100);

    // Adult: Base 50 + Species 40 + no age bonus = 90
    expect(calculateHeuristicScore(form, adult)).toBe(90);
  });
});
