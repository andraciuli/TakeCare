import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { form, animals } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is not configured in .env.local' },
        { status: 500 }
      );
    }

    if (!animals || animals.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // 1. Heuristic Algorithm (Pre-scoring & Fallback)
    const scoredAnimals = animals.map((a: any) => {
      let score = 50; // Base score
      
      // Species match
      if (form.species !== 'No preference') {
        const animalSpecies = a.species.toLowerCase();
        const formSpecies = form.species.toLowerCase();
        if (animalSpecies === formSpecies) {
          score += 40;
        } else {
          score -= 50; // Severe penalty for wrong species
        }
      }

      // Age match
      if (a.age !== null && a.age !== undefined) {
        if (form.agePref === 'Puppy/Kitten' && a.age < 1) score += 10;
        if (form.agePref === 'Young' && a.age >= 1 && a.age <= 3) score += 10;
        if (form.agePref === 'Adult' && a.age > 3 && a.age <= 7) score += 10;
        if (form.agePref === 'Senior' && a.age > 7) score += 10;
      }

      // Breed preference
      if (form.breedPref && a.breed) {
        if (a.breed.toLowerCase().includes(form.breedPref.toLowerCase())) {
          score += 15;
        }
      }

      // Cap between 0 and 100
      score = Math.max(0, Math.min(100, score));
      return { ...a, heuristicScore: score };
    });

    // Sort by heuristic score and take ONLY top 5
    scoredAnimals.sort((a: any, b: any) => b.heuristicScore - a.heuristicScore);
    const topAnimals = scoredAnimals.slice(0, 5);

    // Simplify animal data to reduce token cost (massively speeds up Gemini)
    const simplifiedAnimals = topAnimals.map((a: any) => ({
      id: a.id,
      name: a.name,
      species: a.species,
      breed: a.breed,
      age: a.age,
      description: a.description
    }));

    const prompt = `You are an expert Pet Matchmaker algorithm. 
I have an adopter who filled out a questionnaire with these preferences:
${JSON.stringify(form, null, 2)}

Here are the top 5 pre-filtered animals:
${JSON.stringify(simplifiedAnimals, null, 2)}

Evaluate each of these 5 animals and assign a match score from 0 to 100.
Follow these RULES strictly:
1. If the species completely mismatches the preference, the score must be under 10.
2. Read the description carefully (translate from Romanian if needed).
3. Output EXACTLY your JSON schema array with each animal's id, the match score (0-100), and a short 1-sentence friendly 'reason' IN ROMANIAN explaining why it is a good match.`;

    // Configure the model
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              score: { type: SchemaType.NUMBER, description: "Score from 0 to 100" },
              reason: { type: SchemaType.STRING, description: "1 sentence reason in Romanian" }
            },
            required: ["id", "score", "reason"]
          }
        }
      }
    });

    let result;
    let retries = 2; // Reduced retries since we have a fallback
    let delay = 500;
    let finalScores = null;

    while (retries > 0) {
      try {
        result = await model.generateContent(prompt);
        let output = result.response.text();
        finalScores = JSON.parse(output);
        break; // Success!
      } catch (err: any) {
        if (err.status === 503 && retries > 1) {
          retries--;
          await new Promise(res => setTimeout(res, delay));
          delay *= 2; 
        } else {
          console.warn("Gemini API failed. Using heuristic fallback.", err?.message);
          break; // Exit loop, trigger fallback
        }
      }
    }

    // 2. FALLBACK MECHANISM: If Gemini failed, use the math-based scores
    if (!finalScores) {
      finalScores = topAnimals.map((a: any) => ({
        id: a.id,
        score: a.heuristicScore,
        reason: `Potrivire matematică de ${a.heuristicScore}% (Specie: ${a.species === 'dog' ? 'Câine' : 'Pisică'}, Vârstă: ${a.age || 'necunoscută'} ani).`
      }));
    }

    return NextResponse.json({ matches: finalScores });
    
  } catch (error: any) {
    console.error('Matchmaker API Fatal Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute matches: ' + error.message },
      { status: 500 }
    );
  }
}
