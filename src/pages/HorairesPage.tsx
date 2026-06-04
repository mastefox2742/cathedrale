
const MESSES = [
  { jour: 'Lundi – Vendredi', horaires: ['07h00', '18h30'], stripe: 'var(--liturgy-green)' },
  { jour: 'Samedi', horaires: ['07h00', '10h00', '18h30'], stripe: 'var(--secondary)' },
  { jour: 'Dimanche', horaires: ['07h00', '09h00', '11h00', '17h00'], stripe: 'var(--primary)' },
]

const SACREMENTS = [
  { nom: 'Confessions', detail: 'Sam 15h–17h · Dim 8h–9h45', icon: 'handshake' },
  { nom: 'Baptêmes', detail: '1er dimanche du mois — sur RDV', icon: 'water_drop' },
  { nom: 'Mariages', detail: 'Sur rendez-vous — 2 mois à l\'avance', icon: 'favorite' },
  { nom: 'Onction des malades', detail: '1er vendredi du mois à 18h30', icon: 'healing' },
]

const INFOS = [
  { icon: 'location_on', label: 'Adresse', value: 'Avenue de la Paix, Centre-ville\nBrazzaville, République du Congo' },
  { icon: 'call', label: 'Téléphone', value: '+242 06 000 00 00' },
  { icon: 'mail', label: 'Email', value: 'contact@sacrecoeur-brazza.cg' },
  { icon: 'chat', label: 'WhatsApp', value: '+242 06 000 00 01' },
]

export function HorairesPage() {
  return (
    <div style={{ padding: '0 var(--margin) var(--space-lg)' }}>

      {/* ── Titre ── */}
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        <h1 className="text-headline-lg" style={{ color: 'var(--primary)' }}>Horaires & Contact</h1>
        <p className="text-body-md" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
          Cathédrale Sacré-Cœur de Brazzaville
        </p>
      </div>

      {/* ── Messes ── */}
      <h2 className="text-title-md" style={{ color: 'var(--primary)', marginBottom: 'var(--space-sm)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: 'middle', marginRight: 6 }}>schedule</span>
        Horaires des Messes
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--space-lg)' }}>
        {MESSES.map(m => (
          <div key={m.jour} className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="liturgical-stripe" style={{ background: m.stripe }} />
            <div style={{ paddingLeft: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 17, color: 'var(--on-surface)' }}>{m.jour}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {m.horaires.map(h => (
                  <span key={h} style={{
                    padding: '4px 12px', borderRadius: 'var(--r-full)',
                    background: 'var(--primary)', color: 'white',
                    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
                  }}>{h}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sacrements ── */}
      <h2 className="text-title-md" style={{ color: 'var(--primary)', marginBottom: 'var(--space-sm)' }}>Sacrements</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-lg)' }}>
        {SACREMENTS.map(s => (
          <div key={s.nom} className="card" style={{ padding: '12px var(--space-md)', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-full)', background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 16, color: 'var(--on-surface)' }}>{s.nom}</p>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 2 }}>{s.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Contact ── */}
      <h2 className="text-title-md" style={{ color: 'var(--primary)', marginBottom: 'var(--space-sm)' }}>Informations pratiques</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-md)' }}>
        {INFOS.map(({ icon, label, value }) => (
          <div key={label} className="card" style={{ padding: '12px var(--space-md)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--r-full)', background: 'rgba(115,92,0,0.1)', border: '1px solid rgba(115,92,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <div>
              <p className="text-label-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 2 }}>{label}</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--on-surface)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bouton itinéraire ── */}
      <button
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
        onClick={() => window.open('https://maps.google.com/?q=Cathédrale+Sacré-Coeur+Brazzaville', '_blank')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>near_me</span>
        Obtenir l'itinéraire
      </button>

      {/* ── Carte placeholder ── */}
      <div className="card" style={{
        height: 180, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-container)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--outline-variant)', marginBottom: 8 }}>map</span>
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Carte interactive — disponible Phase 2</p>
        <p style={{ fontSize: 11, color: 'var(--outline)', marginTop: 2 }}>Centre-ville, Brazzaville</p>
      </div>
    </div>
  )
}
