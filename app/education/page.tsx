'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import styles from './education.module.css'

// ─── Quiz Data ───────────────────────────────────────────────
type Option = { text: string; score: number; feedback?: string }
type Question = { question: string; options: Option[] }

const QUIZ_DATA: Question[] = [
  {
    question: "Cât timp poți dedica zilnic (plimbări, joacă, antrenament) animalului tău?",
    options: [
      { text: "Sub 1 oră — sunt foarte ocupat", score: 0, feedback: "Un câine are nevoie de cel puțin 2 ore de plimbări și atenție zilnic. Gândește-te dacă stilul tău de viață permite asta." },
      { text: "Între 1 și 2 ore", score: 10 },
      { text: "Peste 3 ore sau lucrez de acasă", score: 20 },
    ]
  },
  {
    question: "Cum vei proceda dacă noul tău animal roade mobila sau latră noaptea?",
    options: [
      { text: "Îl cert sau pedepsesc fizic.", score: 0, feedback: "Pedeapsa fizică nu funcționează. Animalele au nevoie de educație cu răbdare și întărire pozitivă." },
      { text: "Îl duc înapoi la adăpost.", score: 0, feedback: "Adopția este un angajament pe viață. Problemele comportamentale necesită timp de acomodare." },
      { text: "Apeleze la un dresor profesionist și am răbdare.", score: 20 },
    ]
  },
  {
    question: "Care este bugetul tău lunar estimat pentru hrană de calitate, deparazitări și veterinar?",
    options: [
      { text: "Sub 50 RON — resturile de la masă sunt suficiente.", score: 0, feedback: "Mâncarea de oameni este dăunătoare. Costul minim lunar pentru un animal este 200-300 RON." },
      { text: "Între 150 și 300 RON", score: 10 },
      { text: "Peste 300 RON + un fond de urgență veterinară", score: 20 },
    ]
  },
  {
    question: "Care este motivul principal pentru care vrei să adopți?",
    options: [
      { text: "Vreau un cadou surpriză pentru copilul meu.", score: 0, feedback: "Un animal nu este o jucărie sau un cadou. Un adult trebuie să-și asume responsabilitatea completă." },
      { text: "Vreau un câine de pază, ținut în curte.", score: 0, feedback: "Animalele au nevoie de libertate, afecțiune și interacțiune zilnică, nu de izolare." },
      { text: "Vreau un companion, un nou membru al familiei.", score: 20 },
    ]
  },
  {
    question: "Ce vei face cu animalul când pleci în vacanță?",
    options: [
      { text: "Îl las singur câteva zile cu multă mâncare.", score: 0, feedback: "Niciun animal nu trebuie lăsat singur mai mult de câteva ore (câini) sau 1-2 zile (pisici cu vizite regulate)." },
      { text: "Apelez la prieteni, familie sau un pet-hotel autorizat.", score: 20 },
      { text: "Îl iau cu mine oriunde merg.", score: 20 },
    ]
  }
]

// ─── Education Content ───────────────────────────────────────
const FIRST_TIME_TIPS = [
  { icon: '⏳', title: 'Regula 3-3-3', text: 'Durează 3 zile să se calmeze, 3 săptămâni să învețe rutina și 3 luni să se simtă cu adevărat acasă. Răbdarea este esențială.' },
  { icon: '🔌', title: 'Securizarea Casei', text: 'Ascunde cablurile, mută plantele toxice și securizează ferestrele (mai ales pentru pisici) înainte de sosirea noului membru.' },
  { icon: '🛒', title: 'Cumpărături de Bază', text: 'Asigură-te că ai boluri, hrană, zgardă, lesă, pătuț și jucării pregătite din prima zi.' },
  { icon: '🩺', title: 'Alegerea Veterinarului', text: 'Găsește un medic veterinar de încredere în apropiere și programează o primă vizită de cunoaștere în prima săptămână.' },
]

const CARE_TIPS = [
  { icon: '💉', title: 'Vaccinuri & Deparazitare', text: 'Vaccinurile anuale și tratamentele anti-paraziți (purici, căpușe, viermi) sunt esențiale pentru sănătatea animalului și a familiei tale. Consultă medicul veterinar pentru un calendar personalizat.' },
  { icon: '🍽️', title: 'Nutriție Corectă', text: 'Alege hrană de calitate, adaptată vârstei și taliei. Evită resturile de la masă — multe alimente umane (ciocolată, ceapă, struguri) sunt toxice pentru animale.' },
  { icon: '🏃', title: 'Mișcare Zilnică', text: 'Câinii au nevoie de minimum 2 plimbări pe zi, iar pisicile de joacă activă. Mișcarea previne obezitatea, anxietatea și comportamentele distructive.' },
  { icon: '🦷', title: 'Igiena Dentară', text: 'Bolile dentare afectează 80% dintre animalele de companie după vârsta de 3 ani. Periajul regulat și jucăriile dentare previn infecțiile și costurile veterinare mari.' },
  { icon: '🧠', title: 'Stimulare Mentală', text: 'Puzzle-urile cu hrană, antrenamentele de comenzi și jocurile interactive previn plictiseala și stresul. Un animal stimulat mental este un animal fericit și echilibrat.' },
  { icon: '❤️', title: 'Vizite Veterinare Preventive', text: 'Nu aștepta să apară o problemă. Controalele anuale detectează afecțiuni precoce și scad semnificativ costurile de tratament pe termen lung.' },
]

const SENIOR_REASONS = [
  { icon: '😌', title: 'Caracter Format', text: 'Un câine senior este liniștit și predictibil. Știi exact ce personalitate ai adoptat, fără surprize legate de comportament sau talie.' },
  { icon: '🏠', title: 'Adaptare Rapidă', text: 'Animalele adulte se integrează mai rapid în noua familie. Știu deja să stea singure, nu distrug casa și nu au nevoie de supraveghere constantă.' },
  { icon: '🎓', title: 'Deja Educați', text: 'Majoritatea seniorilor cunosc comenzi de bază și știu să folosească litiera sau să semnalizeze că vor afară. Zero efort de dresaj pentru tine!' },
  { icon: '💤', title: 'Ritm de Viață Calm', text: 'Dacă nu ești un sportiv înrăit, un câine senior ți se potrivește perfect. Prefer plimbări lungi și liniștite în natură față de sprinturi nebunești.' },
  { icon: '🕒', title: 'Timp Mai Puțin Petrecut', text: 'Puii necesită supraveghere constantă, ore de dresaj și nu pot fi lăsați singuri. Un senior este independent și mai puțin pretențios cu timpul tău.' },
  { icon: '🌟', title: 'Actul Suprem de Compasiune', text: 'Seniorii sunt cei mai puțin adoptați din adăposturi. Prin alegerea unui animal bătrân, îi oferi ultimii ani de viață în iubire, nu în singurătate.' },
]

const SPECIAL_NEEDS = [
  { icon: '🦽', title: 'Dizabilități Fizice', text: 'Animale cu 3 picioare, probleme de mobilitate sau paralizie parțială pot duce o viață fericită și activă. Au nevoie de rampe, covor antiderapant și un stăpân răbdător.' },
  { icon: '🦴', title: 'Boli Cronice', text: 'Diabet, epilepsie, boli de inimă — cu medicație corectă și controale regulate, aceste animale oferă aceeași dragoste ca oricare altul.' },
  { icon: '😰', title: 'Traume & Anxietate', text: 'Animalele din adăposturi au adesea traume din trecut. Cu răbdare, rutină și iubire constantă, ele se transformă spectaculos în câteva luni.' },
  { icon: '👁️', title: 'Deficiențe Senzoriale', text: 'Pisicile sau câinii surzi ori orbi navighează surprinzător de bine în medii familiare. Au nevoie de un spațiu sigur și de comunincare tactilă.' },
]

const RESOURCES = [
  ...FIRST_TIME_TIPS.map(t => ({ ...t, category: 'Prima Adopție' })),
  ...CARE_TIPS.map(t => ({ ...t, category: 'Îngrijire de Bază' })),
  ...SENIOR_REASONS.map(t => ({ ...t, category: 'Adopție Senior' })),
  ...SPECIAL_NEEDS.map(t => ({ ...t, category: 'Nevoi Speciale' })),
]

const CATEGORIES = ['Toate', 'Prima Adopție', 'Îngrijire de Bază', 'Adopție Senior', 'Nevoi Speciale'];

export default function EducationPage() {
  const [currentQ, setCurrentQ] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [feedbackList, setFeedbackList] = useState<string[]>([])
  const [isFinished, setIsFinished] = useState(false)
  
  // Filtering state
  const [activeFilter, setActiveFilter] = useState('Toate')

  const handleOption = (opt: Option) => {
    setTotalScore(prev => prev + opt.score)
    if (opt.feedback) setFeedbackList(prev => [...prev, opt.feedback!])
    if (currentQ < QUIZ_DATA.length - 1) setCurrentQ(prev => prev + 1)
    else setIsFinished(true)
  }

  const resetQuiz = () => {
    setCurrentQ(0); setTotalScore(0); setFeedbackList([]); setIsFinished(false)
  }

  const scoreCategory = totalScore >= 80 ? 'excellent' : totalScore >= 50 ? 'good' : 'needsWork'

  // Component for rendering a single resource card
  const ResourceCard = ({ item }: { item: any }) => (
    <div className={styles.resourceCard}>
      <div className={`${styles.resourceIconHeader} ${
        item.category === 'Prima Adopție' ? styles.bgTeal :
        item.category === 'Îngrijire de Bază' ? styles.bgBlue :
        item.category === 'Adopție Senior' ? styles.bgPurple :
        styles.bgTeal
      }`}>
        <span className={styles.largeIcon}>{item.icon}</span>
      </div>
      <div className={styles.resourceContent}>
        <div className={styles.resourceTop}>
          <span className={styles.resourceTag}>{item.category}</span>
        </div>
        <h3 className={styles.resourceTitle}>{item.title}</h3>
        <p className={styles.resourceDesc}>{item.text}</p>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.maxWidth}>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Centrul de Educație</h1>
            <p className={styles.heroSubtitle}>
              Tot ce trebuie să știi înainte să adopți. Parcurge ghidurile de îngrijire, informațiile despre animale speciale și completează testul interactiv ca să fii sigur(ă) că ești pregătit(ă).
            </p>
          </div>
          <div className={styles.heroImageContainer}>
            <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800" alt="Dog reading" className={styles.heroImage} />
          </div>
        </section>

        {/* ── Quiz Section (Integrated) ── */}
        <div className={styles.quizWrapper}>
          <div className={styles.quizContainer}>
            <div className={styles.quizHeader}>
              <h2 className={styles.quizTitle}>Ești pregătit(ă) să adopți?</h2>
              <p className={styles.quizDesc}>Evaluează-ți cunoștințele. Răspunde sincer la aceste întrebări înainte de a lua o decizie.</p>
            </div>
            
            {!isFinished ? (
              <>
                <div className={styles.progressContainer}>
                  <span className={styles.progressText}>Întrebarea {currentQ + 1} din {QUIZ_DATA.length}</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${(currentQ / QUIZ_DATA.length) * 100}%` }} />
                  </div>
                </div>

                <h3 className={styles.questionText}>{QUIZ_DATA[currentQ].question}</h3>

                <div className={styles.optionsGrid}>
                  {QUIZ_DATA[currentQ].options.map((opt, idx) => (
                    <button key={idx} className={styles.optionButton} onClick={() => handleOption(opt)}>
                      {opt.text}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.resultsSection}>
                <h3 className={styles.questionText}>Rezultatul Tău</h3>

                <div className={`${styles.scoreCircle} ${
                  scoreCategory === 'excellent' ? styles.scoreExcellent :
                  scoreCategory === 'good' ? styles.scoreGood :
                  styles.scoreNeedsWork
                }`}>
                  {totalScore}%
                </div>

                {scoreCategory === 'excellent' && (
                  <p><strong>Felicitări!</strong> Ești complet pregătit(ă) să adopți! Ai cunoștințele și dedicarea necesară pentru a oferi o viață excelentă unui animal salvat.</p>
                )}
                {scoreCategory === 'good' && (
                  <p><strong>Ești pe drumul cel bun!</strong> Ești un candidat bun, dar revizuiește informațiile de mai jos pentru câteva aspecte care necesită atenție.</p>
                )}
                {scoreCategory === 'needsWork' && (
                  <p><strong>Mai pregătește-te puțin!</strong> Adopția este o responsabilitate uriașă. Parcurge cu atenție materialele de mai jos înainte de a lua o decizie.</p>
                )}

                {feedbackList.length > 0 && (
                  <div className={styles.feedbackList}>
                    <h4 style={{marginBottom: '1rem'}}>La ce trebuie să lucrezi:</h4>
                    {feedbackList.map((fb, i) => (
                      <div key={i} className={styles.feedbackItem}>
                        <div>⚠️</div>
                        <div>{fb}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.actionButtons}>
                  {totalScore >= 50 && (
                    <Link href="/matchmaker" className={styles.primaryButton}>
                      🐾 Găsește-ți animalul perfect
                    </Link>
                  )}
                  <button onClick={resetQuiz} className={styles.secondaryButton}>
                    Reia Testul
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Informații Educaționale ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Biblioteca de Cunoștințe</h2>
          <p className={styles.sectionSubtitle}>Citește toate informațiile noastre esențiale grupate pe subiecte.</p>
          
          <div className={styles.filtersRow}>
            {CATEGORIES.map(filter => (
              <button 
                key={filter}
                className={`${styles.filterPill} ${activeFilter === filter ? styles.active : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {activeFilter === 'Toate' ? (
            <div>
              {CATEGORIES.filter(c => c !== 'Toate').map(category => (
                <div key={category} style={{ marginBottom: '4rem' }}>
                  <h3 style={{ 
                    fontFamily: 'var(--font-quicksand)', 
                    fontSize: '1.5rem', 
                    marginBottom: '1.5rem', 
                    color: 'var(--on-surface)',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid var(--surface-variant)'
                  }}>
                    {category}
                  </h3>
                  <div className={styles.resourcesGrid}>
                    {RESOURCES.filter(r => r.category === category).map((item, idx) => (
                      <ResourceCard key={idx} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.resourcesGrid}>
              {RESOURCES.filter(r => r.category === activeFilter).map((item, idx) => (
                <ResourceCard key={idx} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
      
      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--outline-variant)', padding: '2rem', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginTop: '4rem' }}>
        <p>© 2024 TakeCare. Nurturing connections between hearts and paws.</p>
      </footer>
    </div>
  )
}
