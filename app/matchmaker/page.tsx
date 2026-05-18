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

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form State
  const [form, setForm] = useState({
    species: 'Dog',
    home: 'No yard',
    amenities: 'None',
    hoa: 'No dog restrictions',
    
    target: 'Myself',
    experience: 'First-time',
    currentPets: 'No dog(s) or cat(s)',
    activity: '(No activity preference)',

    agePref: 'None',
    sizePref: '(No size preference)',
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
      const savedStep = sessionStorage.getItem('matchmaker_step');

      if (savedMatches) setMatches(JSON.parse(savedMatches));
      if (savedForm) setForm(JSON.parse(savedForm));
      if (savedShowResults) setShowResults(JSON.parse(savedShowResults));
      if (savedStep) setStep(JSON.parse(savedStep));
      
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
    sessionStorage.setItem('matchmaker_step', JSON.stringify(step));
  }, [matches, form, showResults, step]);

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

      let scored = data.matches.map((match: any) => {
        const fullAnimal = animals.find(a => a.id === match.id);
        if (!fullAnimal) return null;
        return { ...fullAnimal, matchScore: match.score, matchReason: match.reason };
      }).filter((a: any) => a !== null && a.matchScore > 20);

      scored.sort((a: MatchedAnimal, b: MatchedAnimal) => b.matchScore - a.matchScore);

      setMatches(scored);
      setShowResults(true);
      
      setTimeout(() => {
        document.getElementById('match-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      alert('Error fetching AI matches: ' + err.message);
    } finally {
      setIsMatching(false);
    }
  };

  const cardOption = (field: string, value: string, icon: string, label?: string) => {
    const isSelected = (form as any)[field] === value;
    return (
      <label className={`${styles.cardOptionLabel} ${isSelected ? styles.selected : ''}`}>
        <input 
          type="radio" 
          name={field}
          value={value} 
          checked={isSelected} 
          onChange={(e) => handleChange(field, e.target.value)} 
          className={styles.cardOptionInput}
        />
        <span className={styles.cardIcon}>{icon}</span>
        <span className={styles.cardText}>{label || value}</span>
      </label>
    );
  };

  if (loading) return <div className={styles.page}><Navbar/><div style={{padding: '5rem', textAlign: 'center'}}>Loading...</div></div>;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.maxWidth}>
        
        {/* Header */}
        {!showResults && (
          <div className={styles.header}>
            <h1 className={styles.title}>Find Your Perfect Paw</h1>
            <div className={styles.progressContainer}>
              <span className={styles.stepIndicator}>Step {step} of {totalSteps}</span>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${(step / totalSteps) * 100}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Form */}
        {!showResults && (
          <div className={styles.wizardContainer}>
            <div className={styles.wizardLeft}>
              <img src={
                step === 1 ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800" :
                step === 2 ? "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800" :
                "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800"
              } alt="Pet" className={styles.wizardImage} />
              <div className={styles.wizardOverlay}></div>
              <div className={styles.testimonial}>
                <p className={styles.testimonialQuote}>
                  {step === 1 && `"Tip: Consider your home environment carefully. A high-energy dog might struggle in a small apartment without frequent outdoor access."`}
                  {step === 2 && `"Tip: Be honest about your experience level. Some breeds require firm, experienced handling to thrive and avoid behavioral issues."`}
                  {step === 3 && `"Tip: Don't get stuck on a specific breed! Many mixed breeds offer the perfect balance of traits for your lifestyle."`}
                </p>
                <span className={styles.testimonialAuthor}>
                  {step === 1 && "- Home Compatibility"}
                  {step === 2 && "- Experience Matters"}
                  {step === 3 && "- Keep an Open Mind"}
                </span>
              </div>
            </div>

            <div className={styles.wizardRight}>
              {/* Step 1: Basics & Home */}
              {step === 1 && (
                <>
                  <h2 className={styles.stepTitle}>Basics & Home</h2>
                  <p className={styles.stepDesc}>Tell us about where your new best friend will live.</p>
                  
                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>I'd like to adopt a:</span>
                    <div className={styles.optionsGrid3}>
                      {cardOption('species', 'Dog', '🐶')}
                      {cardOption('species', 'Cat', '🐱')}
                      {cardOption('species', 'No preference', '🐾')}
                    </div>
                  </div>

                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>My home has:</span>
                    <div className={styles.optionsGrid3}>
                      {cardOption('home', 'No yard', '🏢')}
                      {cardOption('home', 'Fenced yard', '🏡')}
                      {cardOption('home', 'Unfenced yard', '🌳')}
                    </div>
                  </div>

                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>Nearby amenities include:</span>
                    <div className={styles.optionsGrid3}>
                      {cardOption('amenities', 'None', '🏘')}
                      {cardOption('amenities', 'Dog park', '🛝')}
                      {cardOption('amenities', 'Trails', '🌲')}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Lifestyle */}
              {step === 2 && (
                <>
                  <h2 className={styles.stepTitle}>Lifestyle & Household</h2>
                  <p className={styles.stepDesc}>Let's understand your daily routine and family.</p>
                  
                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>I am looking to adopt for:</span>
                    <div className={styles.optionsGrid3}>
                      {cardOption('target', 'Myself', '👤')}
                      {cardOption('target', 'My Family', '👨‍👩‍👧‍👦')}
                      {cardOption('target', 'A Friend', '🤝')}
                    </div>
                  </div>

                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>I am a ___ pet owner:</span>
                    <div className={styles.optionsGrid}>
                      {cardOption('experience', 'First-time', '🌱', 'First-time')}
                      {cardOption('experience', 'Experienced', '⭐', 'Experienced')}
                    </div>
                  </div>

                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>My desired pet's activity level should be:</span>
                    <div className={styles.optionsGrid3}>
                      {cardOption('activity', 'Low', '🛋', 'Low')}
                      {cardOption('activity', 'Moderate', '🚶', 'Moderate')}
                      {cardOption('activity', 'High', '🏃', 'High')}
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Preferences */}
              {step === 3 && (
                <>
                  <h2 className={styles.stepTitle}>Preferences</h2>
                  <p className={styles.stepDesc}>Almost done! Any specific requests?</p>
                  
                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>Age preference:</span>
                    <div className={styles.optionsGrid3}>
                      {cardOption('agePref', 'None', '🐾')}
                      {cardOption('agePref', 'Puppy/Kitten', '🍼')}
                      {cardOption('agePref', 'Adult', '🐕')}
                      {cardOption('agePref', 'Senior', '🎓')}
                    </div>
                  </div>

                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>Size preference:</span>
                    <select className={styles.textInput} value={form.sizePref} onChange={(e) => handleChange('sizePref', e.target.value)}>
                      <option value="(No size preference)">Any Size</option>
                      <option value="Small">Small (under 25 lbs)</option>
                      <option value="Medium">Medium (25-60 lbs)</option>
                      <option value="Large">Large (60+ lbs)</option>
                    </select>
                  </div>

                  <div className={styles.questionGroup}>
                    <span className={styles.questionLabel}>A breed that I really like is (Optional):</span>
                    <input 
                      type="text" 
                      className={styles.textInput} 
                      value={form.breedPref}
                      onChange={(e) => handleChange('breedPref', e.target.value)}
                      placeholder="e.g. Golden Retriever, Siamese... (leave blank for any)"
                    />
                  </div>
                </>
              )}

              <div className={styles.wizardActions}>
                {step > 1 ? (
                  <button className={styles.btnBack} onClick={() => setStep(s => s - 1)}>← Previous</button>
                ) : <div></div>}
                
                {step < totalSteps ? (
                  <button className={styles.btnNext} onClick={() => setStep(s => s + 1)}>Next Step →</button>
                ) : (
                  <button className={styles.btnSubmit} onClick={calculateMatches} disabled={isMatching}>
                    {isMatching ? 'Analyzing...' : 'Find My Match ❤️'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div id="match-results" className={styles.resultsSection}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem'}}>
              <h2 className={styles.resultsHeader} style={{marginBottom: 0}}>Your Best Matches</h2>
              <button className={styles.btnBack} onClick={() => setShowResults(false)}>← Edit Preferences</button>
            </div>
            
            {matches.length === 0 ? (
              <p style={{textAlign: 'center', fontSize: '1.2rem', color: 'var(--on-surface-variant)'}}>We couldn't find any perfect matches right now. Try adjusting your preferences!</p>
            ) : (
              <div className={styles.grid}>
                {matches.map(animal => (
                  <div key={animal.id} className={styles.resultCard}>
                    <div className={`${styles.matchScoreBadge} ${animal.matchScore >= 80 ? styles.perfectMatch : ''}`}>
                      {animal.matchScore}% Match
                    </div>
                    <div className={styles.resultImageContainer}>
                      <img 
                        src={(animal.image_url && animal.image_url.length > 0) ? animal.image_url[0] : (animal.species === 'cat' ? "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800" : "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800")} 
                        alt={animal.name} 
                        className={styles.resultImage} 
                      />
                    </div>
                    <div className={styles.resultContent}>
                      <h3 className={styles.resultTitle}>{animal.name}</h3>
                      <p className={styles.resultInfo}>
                        <strong>Breed:</strong> {animal.breed || 'Unknown'}
                      </p>
                      <p className={styles.resultInfo}>
                        <strong>Age:</strong> {animal.age} years
                      </p>
                      
                      {animal.matchReason && (
                        <div className={styles.reasonBadge}>
                          <strong>AI Note:</strong> {animal.matchReason}
                        </div>
                      )}
                      
                      <div className={styles.actionButtons}>
                        <Link href={`/animals/${animal.id}`} className={styles.btnDetails}>
                          View Details
                        </Link>
                        <Link href={`/animals/${animal.id}`} className={styles.btnAdopt}>
                          Request Adoption
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Why Use The Matcher */}
        {!showResults && (
          <section className={styles.featuresSection}>
            <h2 className={styles.featuresTitle}>Why Use The Matcher?</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🧠</div>
                <h3 className={styles.featureTitle}>AI-Powered Insights</h3>
                <p className={styles.featureDesc}>Our algorithm looks beyond breed to find true personality compatibility.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>⏳</div>
                <h3 className={styles.featureTitle}>Save Time</h3>
                <p className={styles.featureDesc}>Don't scroll through hundreds of profiles. We bring the best matches to you.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>❤️</div>
                <h3 className={styles.featureTitle}>Better Outcomes</h3>
                <p className={styles.featureDesc}>Matched pets are less likely to be returned and more likely to thrive.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🛡️</div>
                <h3 className={styles.featureTitle}>No Bias</h3>
                <p className={styles.featureDesc}>We match based on facts and lifestyle, giving overlooked pets a fair chance.</p>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
