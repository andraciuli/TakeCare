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
  { color: '#3b82f6', icon: '🦽', title: 'Dizabilități Fizice', text: 'Animale cu 3 picioare, probleme de mobilitate sau paralizie parțială pot duce o viață fericită și activă. Au nevoie de rampe, covor antiderapant și un stăpân răbdător.' },
  { color: '#8b5cf6', icon: '🦴', title: 'Boli Cronice', text: 'Diabet, epilepsie, boli de inimă — cu medicație corectă și controale regulate, aceste animale oferă aceeași dragoste ca oricare altul.' },
  { color: '#f59e0b', icon: '😰', title: 'Traume & Anxietate', text: 'Animalele din adăposturi au adesea traume din trecut. Cu răbdare, rutină și iubire constantă, ele se transformă spectaculos în câteva luni.' },
  { color: '#10b981', icon: '👁️', title: 'Deficiențe Senzoriale', text: 'Pisicile sau câinii surzi ori orbi navighează surprinzător de bine în medii familiare. Au nevoie de un spațiu sigur și de comunincare tactilă.' },
]

// ─── Component ───────────────────────────────────────────────
export default function EducationPage() {
  const [currentQ, setCurrentQ] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [feedbackList, setFeedbackList] = useState<string[]>([])
  const [isFinished, setIsFinished] = useState(false)

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

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <p className={styles.heroTagline}>📚 Centrul de Educație</p>
        <h1 className={styles.heroTitle}>Tot ce trebuie să știi<br/>înainte să adopți</h1>
        <p className={styles.heroSubtitle}>
          Ghiduri de îngrijire, informații despre animale speciale și un test interactiv ca să fii sigur(ă) că ești pregătit(ă).
        </p>
      </section>

      {/* ── Quiz Interactiv ── */}
      <section className={styles.quizSection}>
        <div className={styles.quizInner}>
          <span className={styles.sectionTag} style={{ color: '#3b82f6' }}>✅ Test de Pregătire</span>
          <h2 className={styles.sectionTitle} style={{ textAlign: 'center' }}>Ești pregătit(ă) să adopți?</h2>
          <p className={styles.sectionSubtitle} style={{ margin: '0 auto 2.5rem', textAlign: 'center' }}>
            Începe prin a-ți evalua cunoștințele. Răspunde sincer la aceste 5 întrebări înainte de a parcurge restul materialelor.
          </p>

          <div className={styles.quizCard}>
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
                <h3 className={styles.resultTitle}>Rezultatul Tău</h3>

                <div className={`${styles.scoreCircle} ${
                  scoreCategory === 'excellent' ? styles.scoreExcellent :
                  scoreCategory === 'good' ? styles.scoreGood :
                  styles.scoreNeedsWork
                }`}>
                  {totalScore}%
                </div>

                {scoreCategory === 'excellent' && (
                  <p className={styles.resultMessage}><strong>Felicitări!</strong> Ești complet pregătit(ă) să adopți! Ai cunoștințele și dedicarea necesară pentru a oferi o viață excelentă unui animal salvat.</p>
                )}
                {scoreCategory === 'good' && (
                  <p className={styles.resultMessage}><strong>Ești pe drumul cel bun!</strong> Ești un candidat bun, dar revizuiește informațiile de mai jos pentru câteva aspecte care necesită atenție.</p>
                )}
                {scoreCategory === 'needsWork' && (
                  <p className={styles.resultMessage}><strong>Mai pregătește-te puțin!</strong> Adopția este o responsabilitate uriașă. Parcurge cu atenție materialul educațional de mai jos înainte de a lua o decizie.</p>
                )}

                {feedbackList.length > 0 && (
                  <div className={styles.feedbackList}>
                    <h4 className={styles.feedbackTitle}>La ce trebuie să lucrezi:</h4>
                    {feedbackList.map((fb, i) => (
                      <div key={i} className={styles.feedbackItem}>
                        <div className={styles.feedbackIcon}>!</div>
                        <div className={styles.feedbackText}>{fb}</div>
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
      </section>

      <hr className={styles.divider} />

      {/* ── Îngrijire de Bază ── */}
      <section className={styles.section}>
        <span className={styles.sectionTag} style={{ color: '#3b82f6' }}>🩺 Îngrijire</span>
        <h2 className={styles.sectionTitle}>Bazele îngrijirii unui animal de companie</h2>
        <p className={styles.sectionSubtitle}>
          Un animal sănătos înseamnă un animal fericit. Iată ce trebuie să știi din prima zi.
        </p>
        <div className={styles.cardsGrid}>
          {CARE_TIPS.map((tip, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardIcon}>{tip.icon}</div>
              <h3 className={styles.cardTitle}>{tip.title}</h3>
              <p className={styles.cardText}>{tip.text}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className={styles.divider} />

      {/* ── Animale Senior ── */}
      <section className={styles.seniorSection}>
        <div className={styles.seniorInner}>
          <span className={styles.sectionTag}>🐾 Adopție Senior</span>
          <h2 className={styles.sectionTitle}>De ce să adopți un animal senior?</h2>
          <p className={styles.sectionSubtitle}>
            Animalele bătrâne sunt cele mai puțin adoptate, dar pot fi cele mai recunoscătoare și ușor de îngrijit.
          </p>
          <div className={styles.seniorGrid}>
            {SENIOR_REASONS.map((reason, i) => (
              <div key={i} className={styles.seniorCard}>
                <div className={styles.cardIcon}>{reason.icon}</div>
                <h3 className={styles.cardTitle}>{reason.title}</h3>
                <p className={styles.cardText}>{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nevoi Speciale ── */}
      <section className={styles.section}>
        <span className={styles.sectionTag} style={{ color: '#8b5cf6' }}>💜 Nevoi Speciale</span>
        <h2 className={styles.sectionTitle}>Animale cu nevoi speciale</h2>
        <p className={styles.sectionSubtitle}>
          Diferit nu înseamnă mai puțin. Aceste animale oferă iubire necondiționată și au nevoie de o șansă.
        </p>
        <div className={styles.specialGrid}>
          {SPECIAL_NEEDS.map((item, i) => (
            <div key={i} className={styles.specialCard} style={{ borderLeftColor: item.color }}>
              <div className={styles.cardIcon}>{item.icon}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardText}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
