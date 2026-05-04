'use client'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import styles from './matchmaker.module.css'

type Animal = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  sex: string;
  description: string;
  status: string;
  image_url: string[];
  attributes?: Record<string, boolean>;
  shelters?: any;
}

type MatchedAnimal = Animal & { matchScore: number; matchReason?: string };

export default function MatchmakerPage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [matches, setMatches] = useState<MatchedAnimal[]>([])
  const [loading, setLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)

  // Form State
  const [form, setForm] = useState({
    species: 'Dog',
    target: 'Myself',
    experience: 'First-time',
    currentPets: 'No dog(s) or cat(s)',
    home: 'No yard',
    amenities: 'None',
    hoa: 'No dog restrictions',
    agePref: 'None',
    sizePref: '(No size preference)',
    activity: '(No activity preference)',
    mustBe: '(No preference)',
    specialNeeds: 'Open',
    breedPref: ''
  });

  // Load from sessionStorage on mount to preserve state when going back
  useEffect(() => {
    try {
      const savedMatches = sessionStorage.getItem('matchmaker_matches');
      const savedForm = sessionStorage.getItem('matchmaker_form');
      const savedShowResults = sessionStorage.getItem('matchmaker_showResults');

      if (savedMatches) setMatches(JSON.parse(savedMatches));
      if (savedForm) setForm(JSON.parse(savedForm));
      if (savedShowResults) setShowResults(JSON.parse(savedShowResults));
      
      // If we had results, scroll to them
      if (savedShowResults === 'true') {
        setTimeout(() => {
          document.getElementById('match-results')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } catch (e) {
      console.error('Failed to load matchmaker state from session storage', e);
    }
  }, []);

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    sessionStorage.setItem('matchmaker_matches', JSON.stringify(matches));
    sessionStorage.setItem('matchmaker_form', JSON.stringify(form));
    sessionStorage.setItem('matchmaker_showResults', JSON.stringify(showResults));
  }, [matches, form, showResults]);

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const { data, error } = await supabase
          .from('animals')
          .select(`*, shelters(id, name, address, phone)`)
          .eq('status', 'available');
          
        if (error) throw error;
        setAnimals(data || []);
      } catch (err: any) {
        console.error('Error fetching animals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnimals();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const [isMatching, setIsMatching] = useState(false);

  const calculateMatches = async () => {
    setIsMatching(true);
    setShowResults(false);

    try {
      const res = await fetch('/api/matchmaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, animals })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Merge back the scores and reasons to full animal objects
      let scored = data.matches.map((match: any) => {
        const fullAnimal = animals.find(a => a.id === match.id);
        if (!fullAnimal) return null;
        return { ...fullAnimal, matchScore: match.score, matchReason: match.reason };
      }).filter((a: any) => a !== null && a.matchScore > 20);

      // Sort highest score first
      scored.sort((a: MatchedAnimal, b: MatchedAnimal) => b.matchScore - a.matchScore);

      setMatches(scored);
      setShowResults(true);
      
      // Scroll to results seamlessly
      setTimeout(() => {
        document.getElementById('match-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      alert('Error fetching AI matches: ' + err.message);
    } finally {
      setIsMatching(false);
    }
  };

  const radioGroup = (label: string, field: string, options: string[]) => (
    <div className={styles.questionGroup}>
      <label className={styles.questionLabel}>{label}</label>
      <div className={styles.optionsGrid}>
        {options.map(opt => (
          <label key={opt} className={styles.optionLabel}>
            <input 
              type="radio" 
              name={field}
              value={opt} 
              checked={(form as any)[field] === opt} 
              onChange={(e) => handleChange(field, e.target.value)} 
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          <div className={styles.header}>
            <h1 className={styles.title}>Perfect Matchmaker</h1>
            <p className={styles.subtitle}>
              Answer a few simple questions about your lifestyle and preferences, and we'll match you with the pets that fit your home best.
            </p>
          </div>

          <div className={styles.formContainer}>
            {radioGroup('I\'d like to adopt a', 'species', ['Dog', 'Cat', 'No preference'])}
            {radioGroup('I am looking to adopt for', 'target', ['Myself', 'My Family', 'A Friend'])}
            {radioGroup('I am a ___ pet owner', 'experience', ['First-time', 'Experienced'])}
            {radioGroup('I currently have', 'currentPets', ['No dog(s) or cat(s)', 'Other dogs', 'Other cats', 'Both'])}
            {radioGroup('My home has', 'home', ['No yard', 'Fenced yard', 'Unfenced yard'])}
            {radioGroup('Nearby amenities include', 'amenities', ['None', 'Dog park', 'Trails'])}
            {radioGroup('There are ___ as part of my HOA or lease', 'hoa', ['No dog restrictions', 'Breed restrictions', 'Size restrictions'])}
            {radioGroup('Age preference', 'agePref', ['None', 'Puppy/Kitten', 'Young', 'Adult', 'Senior'])}
            {radioGroup('Size preference', 'sizePref', ['(No size preference)', 'Small', 'Medium', 'Large', 'Extra Large'])}
            {radioGroup(`My ${form.species === 'Cat' ? 'cat' : 'dog'}’s activity level should be`, 'activity', ['(No activity preference)', 'Low', 'Moderate', 'High'])}
            {radioGroup(`My ${form.species === 'Cat' ? 'cat' : 'dog'} must be`, 'mustBe', ['(No preference)', 'Good with kids', 'Good with dogs', 'Good with cats'])}
            {radioGroup(`I am ___ to adopting a ${form.species === 'Cat' ? 'cat' : 'dog'} with special needs`, 'specialNeeds', ['Open', 'Not open'])}
            
            <div className={styles.questionGroup}>
              <label className={styles.questionLabel}>A breed that I really like is</label>
              <input 
                type="text" 
                className={styles.textInput} 
                value={form.breedPref}
                onChange={(e) => handleChange('breedPref', e.target.value)}
                placeholder="e.g. Golden Retriever, Siamese... (leave blank for any)"
              />
            </div>

            <button className={styles.submitBtn} onClick={calculateMatches} disabled={isMatching}>
              {isMatching ? 'Analyzing Matches...' : 'Find My Matches'}
            </button>
          </div>

          {showResults && (
            <div id="match-results" className={styles.resultsSection}>
              <h2 className={styles.resultsHeader}>Your Best Matches</h2>
              {matches.length === 0 ? (
                <p style={{textAlign: 'center', fontSize: '1.2rem'}}>We couldn't find any perfect matches right now. Try adjusting your preferences!</p>
              ) : (
                <div className={styles.grid}>
                  {matches.map(animal => (
                    <div key={animal.id} className={styles.card}>
                      <div className={`${styles.matchScoreBadge} ${animal.matchScore >= 80 ? styles.perfectMatch : ''}`}>
                        {animal.matchScore}% Match
                      </div>
                      {animal.image_url && animal.image_url.length > 0 && (
                        <div className={styles.imageContainer}>
                          <img src={animal.image_url[0]} alt={animal.name} className={styles.animalImage} />
                        </div>
                      )}
                      <h3 className={styles.cardTitle}>{animal.name}</h3>
                      <p className={styles.info}>
                        <span className={styles.label}>Breed:</span> {animal.breed || 'Unknown'}
                      </p>
                      <p className={styles.info}>
                        <span className={styles.label}>Age:</span> {animal.age} years
                      </p>
                      
                      {animal.matchReason && (
                        <div className={styles.reasonBadge}>
                          AI Note: {animal.matchReason}
                        </div>
                      )}

                      <p className={styles.description}>{animal.description}</p>
                      
                      <div className={styles.actionButtons}>
                        <Link href={`/animals/${animal.id}`} className={styles.btnDetails}>
                          Vezi Detalii
                        </Link>
                        <Link href={`/animals/${animal.id}`} className={styles.btnAdopt}>
                          Cerere Adopție
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
