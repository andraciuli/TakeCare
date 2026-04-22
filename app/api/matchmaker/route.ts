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

    // Configure the model
    // 1.5 flash is incredibly fast and cheap, perfect for this task
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              score: { type: SchemaType.NUMBER, description: "A highly selective score from 0 to 100 based heavily on matching precise constraints." },
              reason: { type: SchemaType.STRING, description: "A very short, energetic 1 sentence explanation in Romanian on why this animal fits." }
            },
            required: ["id", "score", "reason"]
          }
        }
      }
    });

    // Simplify animal data to reduce token cost
    const simplifiedAnimals = animals.map((a: any) => ({
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

Here is the list of available animals:
${JSON.stringify(simplifiedAnimals, null, 2)}

Evaluate each animal and assign a match score from 0 to 100.
Follow these RULES strictly:
1. If the species completely mismatches the preference (e.g. user wants "Dog" but animal is "Cat", or vice versa), the score must be under 10. "No preference" is fine for both.
2. Carefully read the animal's text description. Translate it in your head if it's in Romanian (e.g., "pui" = puppy, "jucăuş" = playful, etc.).
3. Heavily penalize mismatchs in activity level, constraints (no yard vs needs yard), kids/dogs/cats constraints.
4. Output EXACTLY your JSON schema array with each animal's id, the match score (0-100), and a short 1-sentence friendly 'reason' IN ROMANIAN explaining why it is or isn't a great match.`;

    const result = await model.generateContent(prompt);
    let output = result.response.text();
    const finalScores = JSON.parse(output);

    return NextResponse.json({ matches: finalScores });
    
  } catch (error: any) {
    console.error('Matchmaker API Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute matches: ' + error.message },
      { status: 500 }
    );
  }
}
