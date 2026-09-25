import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Navigation, Phone, Check } from 'lucide-react'
import { useParoisse } from '../contexts/ParoisseContext'
import { paroisseLaPlusProche } from '../services/paroisses'

export function ParoissesPage() {
  const { paroisses, courante, choisir, chargement } = useParoisse()
  const [recherche, setRecherche] = useState('')
  const [geo, setGeo] = useState<{ etat: 'idle' | 'cherche' | 'ok' | 'erreur'; message?: string }>({ etat: 'idle' })

  const q = recherche.trim().toLowerCase()
  const liste = paroisses.filter(p => !q || `${p.nom} ${p.quartier ?? ''} ${p.adresse ?? ''} ${p.cure ?? ''}`.toLowerCase().includes(q))

  function localiser() {
    if (!navigator.geolocation) { setGeo({ etat: 'erreur', message: "La géolocalisation n'est pas disponible sur cet appareil." }); return }
    setGeo({ etat: 'cherche' })
    navigator.geolocation.getCurrentPosition(
      pos => {
        const res = paroisseLaPlusProche(paroisses, pos.coords.latitude, pos.coords.longitude)
        if (!res) { setGeo({ etat: 'erreur', message: "Aucune paroisse n'a encore de position enregistrée." }); return }
        choisir(res.paroisse.id)
        setGeo({ etat: 'ok', message: `${res.paroisse.nom} — à environ ${res.km < 1 ? Math.round(res.km * 1000) + ' m' : res.km.toFixed(1) + ' km'}` })
      },
      () => setGeo({ etat: 'erreur', message: 'Position refusée ou indisponible.' }),
      { timeout: 10000, maximumAge: 300000 },
    )
  }

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Archidiocèse de Brazzaville</p>
          <h1>Annuaire <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>des paroisses</em></h1>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner">
          <div className="reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={15} color="var(--text-light)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Nom, quartier, curé…"
                className="dark-input" style={{ width: '100%', paddingLeft: 34 }} aria-label="Rechercher une paroisse" />
            </div>
            <button onClick={localiser} className="btn-gold" disabled={geo.etat === 'cherche'}>
              <Navigation size={14} /> {geo.etat === 'cherche' ? 'Recherche…' : 'La plus proche de moi'}
            </button>
          </div>
          {geo.message && (
            <p style={{ fontSize: 12, color: geo.etat === 'erreur' ? '#C62828' : 'var(--blue)', marginBottom: 16 }}>
              {geo.etat === 'ok' ? '📍 Paroisse sélectionnée : ' : ''}{geo.message}
            </p>
          )}

          {chargement ? (
            <div className="page-loader"><div className="page-loader-ring" /></div>
          ) : liste.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-light)', padding: '32px 0' }}>Aucune paroisse ne correspond à votre recherche.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginTop: 16 }}>
              {liste.map(p => {
                const estCourante = courante?.id === p.id
                return (
                  <div key={p.id} className="dark-card reveal" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: estCourante ? '1.5px solid var(--accent)' : undefined }}>
                    <div style={{ aspectRatio: '16/9', position: 'relative', overflow: 'hidden', background: 'var(--bg-alt)' }}>
                      <img src={p.photoUrl || '/cathedrale.jpg'} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.85)' }} />
                      {estCourante && (
                        <span style={{ position: 'absolute', top: 10, left: 10, padding: '3px 10px', background: 'var(--primary)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', borderRadius: 'var(--r-full)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Check size={11} /> Ma paroisse
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{p.nom}</h2>
                      {(p.quartier || p.adresse) && (
                        <p style={{ fontSize: 12, color: 'var(--text-mid)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {[p.adresse, p.quartier].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {p.telephone && (
                        <p style={{ fontSize: 12, color: 'var(--text-mid)', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Phone size={13} /> {p.telephone}
                        </p>
                      )}
                      {p.horaires.messes?.find(m => /dimanche/i.test(m.jour)) && (
                        <p style={{ fontSize: 11, color: 'var(--accent-dark)', fontWeight: 700 }}>
                          Dimanche : {p.horaires.messes.find(m => /dimanche/i.test(m.jour))!.horaires.join(' · ')}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10, flexWrap: 'wrap' }}>
                        <Link to={`/paroisses/${p.slug}`} className="btn-outline" style={{ fontSize: 10 }}>Voir la fiche</Link>
                        {!estCourante && (
                          <button onClick={() => choisir(p.id)} className="btn-gold" style={{ fontSize: 10 }}>Choisir</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
