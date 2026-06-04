import { useState, useEffect, useRef } from 'react'

// Langues congolaises — à intégrer via fichier téléchargé par l'admin
const LANG_LOCALES = [
  { id: 'fr-seg',   label: 'Français (Segond)', flag: '🇫🇷',  available: true  },
  { id: 'en-kjv',   label: 'English (KJV)',      flag: '🇬🇧',  available: true  },
  { id: 'lingala',  label: 'Lingala',             flag: '🇨🇩',  available: false },
  { id: 'kikongo',  label: 'Kikongo',             flag: '🇨🇩',  available: false },
  { id: 'kitouba',  label: 'Kitouba',             flag: '🇨🇩',  available: false },
]

const LIVRES_NT = [
  'Matthieu','Marc','Luc','Jean','Actes','Romains','1 Corinthiens','2 Corinthiens',
  'Galates','Éphésiens','Philippiens','Colossiens','1 Thessaloniciens','2 Thessaloniciens',
  '1 Timothée','2 Timothée','Tite','Philémon','Hébreux','Jacques','1 Pierre','2 Pierre',
  '1 Jean','2 Jean','3 Jean','Jude','Apocalypse',
]
const LIVRES_AT = [
  'Genèse','Exode','Lévitique','Nombres','Deutéronome','Josué','Juges','Ruth',
  '1 Samuel','2 Samuel','1 Rois','2 Rois','1 Chroniques','2 Chroniques','Esdras',
  'Néhémie','Esther','Job','Psaumes','Proverbes','Ecclésiaste','Cantique des Cantiques',
  'Isaïe','Jérémie','Lamentations','Ézéchiel','Daniel','Osée','Joël','Amos',
  'Abdias','Jonas','Michée','Nahum','Habacuc','Sophonie','Aggée','Zacharie','Malachie',
]

// Versets du jour — statiques pour ne pas dépendre de l'API pour la page principale
const VERSETS_DU_JOUR = [
  { ref: 'Jean 3:16', texte: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu\'il ait la vie éternelle.' },
  { ref: 'Psaumes 23:1', texte: 'L\'Éternel est mon berger : je ne manquerai de rien.' },
  { ref: 'Philippiens 4:13', texte: 'Je puis tout par celui qui me fortifie.' },
  { ref: 'Matthieu 28:20', texte: 'Et voici, je suis avec vous tous les jours, jusqu\'à la fin du monde.' },
  { ref: 'Romains 8:28', texte: 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu.' },
  { ref: 'Jérémie 29:11', texte: 'Car je connais les projets que j\'ai formés sur vous, dit l\'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l\'espérance.' },
]

export function BiblePage() {
  const today = new Date()
  const versetIndex = (today.getDate() + today.getMonth()) % VERSETS_DU_JOUR.length
  const versetDuJour = VERSETS_DU_JOUR[versetIndex]

  const [langId, setLangId] = useState('fr-seg')
  const [section, setSection] = useState<'AT' | 'NT'>('NT')
  const [livreChoisi, setLivreChoisi] = useState('Jean')
  const [chapitre, setChapitre] = useState(1)
  const [versets, setVersets] = useState<{ num: number; texte: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showLivres, setShowLivres] = useState(false)
  const contenuRef = useRef<HTMLDivElement>(null)

  const langActuelle = LANG_LOCALES.find(l => l.id === langId)
  const livres = section === 'NT' ? LIVRES_NT : LIVRES_AT
  const livresFiltres = search ? livres.filter(l => l.toLowerCase().includes(search.toLowerCase())) : livres

  // Simulation de chargement de versets (en prod : appel API.Bible)
  useEffect(() => {
    setLoading(true)
    setVersets([])

    // Données simulées — à remplacer par vraie intégration API.Bible
    const timer = setTimeout(() => {
      if (!langActuelle?.available) {
        setVersets([])
        setLoading(false)
        return
      }
      // Génère des versets fictifs pour démo
      const count = livreChoisi === 'Jean' && chapitre === 3 ? 36
        : livreChoisi === 'Psaumes' && chapitre === 23 ? 6
        : 20
      setVersets(
        Array.from({ length: count }, (_, i) => ({
          num: i + 1,
          texte: `[${livreChoisi} ${chapitre}:${i + 1}] — Texte complet chargé via API.Bible. Intégrez votre clé API dans BiblePage.tsx pour afficher les vrais versets.`,
        }))
      )
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [livreChoisi, chapitre, langId, langActuelle])

  function choisirLivre(l: string) {
    setLivreChoisi(l)
    setChapitre(1)
    setShowLivres(false)
    setSearch('')
    setTimeout(() => contenuRef.current?.scrollTo({ top: 0 }), 100)
  }

  return (
    <div style={{ padding: '0 var(--margin) var(--space-lg)' }}>

      {/* Header */}
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>Sainte Bible</h1>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
          Parole de Dieu — Lecture & méditation
        </p>
      </div>

      {/* Verset du jour */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), #0d47a1)',
        borderRadius: 16, padding: '20px',
        marginBottom: 'var(--space-md)', color: 'white',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          fontSize: 120, opacity: 0.07, fontFamily: 'Georgia, serif', lineHeight: 1,
        }}>✝</div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 10 }}>
          Verset du jour
        </p>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.6, fontStyle: 'italic' }}>
          « {versetDuJour.texte} »
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, marginTop: 10, color: 'var(--gold, #FED45B)' }}>
          — {versetDuJour.ref}
        </p>
      </div>

      {/* Sélecteur de langue */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 8 }}>
          Langue
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LANG_LOCALES.map(l => (
            <button
              key={l.id}
              onClick={() => setLangId(l.id)}
              disabled={!l.available}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 'var(--r-full)', border: 'none',
                background: langId === l.id ? 'var(--primary)' : l.available ? 'var(--surface-container)' : 'rgba(0,0,0,0.05)',
                color: langId === l.id ? 'white' : l.available ? 'var(--on-surface)' : 'var(--outline)',
                fontSize: 13, fontWeight: 600, cursor: l.available ? 'pointer' : 'not-allowed',
                opacity: l.available ? 1 : 0.55,
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {l.flag} {l.label}
              {!l.available && (
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                  background: 'var(--secondary-container)', color: 'var(--secondary)',
                  borderRadius: 4, padding: '1px 5px', marginLeft: 2,
                }}>
                  Bientôt
                </span>
              )}
            </button>
          ))}
        </div>
        {!langActuelle?.available && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(115,92,0,0.08)', border: '1px solid rgba(115,92,0,0.2)',
          }}>
            <p style={{ fontSize: 13, color: 'var(--secondary)', fontWeight: 600 }}>
              📖 Traduction en {langActuelle?.label} — en préparation
            </p>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
              La commission pastorale travaille sur l'intégration de cette version. Elle sera disponible prochainement.
            </p>
          </div>
        )}
      </div>

      {langActuelle?.available && (
        <>
          {/* AT / NT */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-sm)' }}>
            {(['NT', 'AT'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setSection(s); setLivreChoisi(s === 'NT' ? 'Jean' : 'Genèse'); setChapitre(1) }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                  background: section === s ? 'var(--primary)' : 'var(--surface-container)',
                  color: section === s ? 'white' : 'var(--on-surface-variant)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {s === 'NT' ? '✝ Nouveau Testament' : '📜 Ancien Testament'}
              </button>
            ))}
          </div>

          {/* Livre actuel */}
          <button
            onClick={() => setShowLivres(!showLivres)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              background: 'white', border: '1.5px solid var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8, cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
              {livreChoisi}
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>
              {showLivres ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {/* Liste des livres */}
          {showLivres && (
            <div style={{
              background: 'white', borderRadius: 12, marginBottom: 12,
              border: '1px solid rgba(0,35,111,0.12)',
              boxShadow: '0 4px 20px rgba(0,35,111,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,35,111,0.08)' }}>
                <input
                  type="text"
                  placeholder="Rechercher un livre…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid rgba(0,35,111,0.15)', fontSize: 14,
                    fontFamily: 'var(--font-sans)', outline: 'none',
                    background: 'var(--surface-container)',
                  }}
                />
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {livresFiltres.map(l => (
                  <button
                    key={l}
                    onClick={() => choisirLivre(l)}
                    style={{
                      width: '100%', padding: '11px 16px', textAlign: 'left',
                      border: 'none', borderBottom: '1px solid rgba(0,35,111,0.04)',
                      background: l === livreChoisi ? 'rgba(0,35,111,0.06)' : 'white',
                      color: l === livreChoisi ? 'var(--primary)' : 'var(--on-surface)',
                      fontFamily: 'var(--font-sans)', fontSize: 14,
                      fontWeight: l === livreChoisi ? 700 : 400, cursor: 'pointer',
                    }}
                  >
                    {l === livreChoisi && '✓ '}{l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation chapitres */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--surface-container)', borderRadius: 12,
            padding: '8px 12px', marginBottom: 'var(--space-md)',
          }}>
            <button
              onClick={() => chapitre > 1 && setChapitre(c => c - 1)}
              disabled={chapitre <= 1}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: chapitre > 1 ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
                color: 'white', fontSize: 20, cursor: chapitre > 1 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>
              Chapitre {chapitre}
            </span>
            <button
              onClick={() => setChapitre(c => c + 1)}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: 'var(--primary)', color: 'white',
                fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >›</button>
          </div>

          {/* Versets */}
          <div ref={contenuRef} style={{ paddingBottom: 8 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--primary)' }}>hourglass_top</span>
                <p style={{ color: 'var(--on-surface-variant)', marginTop: 8 }}>Chargement…</p>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 14, padding: '16px 16px 8px', boxShadow: '0 2px 12px rgba(0,35,111,0.06)' }}>
                {versets.map(v => (
                  <div
                    key={v.num}
                    style={{
                      display: 'flex', gap: 10, paddingBottom: 14, marginBottom: 14,
                      borderBottom: '1px solid rgba(0,35,111,0.05)',
                    }}
                  >
                    <span style={{
                      flexShrink: 0, minWidth: 24, fontSize: 11, fontWeight: 700,
                      color: 'var(--secondary)', paddingTop: 3,
                    }}>
                      {v.num}
                    </span>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.7, color: 'var(--on-surface)' }}>
                      {v.texte}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
