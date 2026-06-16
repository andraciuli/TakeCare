import { POST } from '@/app/api/matchmaker/route';
import { NextResponse } from 'next/server';

// Mock the Gemini API client entirely to isolate the route's integration flow
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            generateContent: jest.fn().mockRejectedValue(new Error('Simulated Gemini API Failure'))
          };
        })
      };
    }),
    SchemaType: {
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER'
    }
  };
});

describe('Matchmaker API Route Integration Test', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'mock-api-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return matches based on local heuristic fallback when Gemini API fails', async () => {
    const mockRequestPayload = {
      form: {
        species: 'Dog',
        agePref: 'Young',
        breedPref: 'Labrador'
      },
      animals: [
        {
          id: '1',
          name: 'Buddy',
          species: 'dog',
          age: 2,
          breed: 'Labrador Retriever',
          description: 'A friendly retriever.'
        },
        {
          id: '2',
          name: 'Luna',
          species: 'cat',
          age: 4,
          breed: 'Siamese',
          description: 'A quiet cat.'
        }
      ]
    };

    // Construct a mock Request object
    const request = new Request('http://localhost/api/matchmaker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockRequestPayload)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('matches');
    expect(Array.isArray(json.matches)).toBe(true);
    expect(json.matches.length).toBe(2);

    // Buddy should have a higher score (perfect match) than Luna (species mismatch)
    const buddyMatch = json.matches.find((m: any) => m.id === '1');
    const lunaMatch = json.matches.find((m: any) => m.id === '2');

    expect(buddyMatch.score).toBe(100);
    expect(lunaMatch.score).toBeLessThanOrEqual(10);
    expect(buddyMatch.reason).toContain('Potrivire');
  });

  test('should return 500 status code if API key is not configured', async () => {
    delete process.env.GEMINI_API_KEY;

    const request = new Request('http://localhost/api/matchmaker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ form: {}, animals: [] })
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json).toHaveProperty('error');
    expect(json.error).toContain('Gemini API Key is not configured');
  });
});
