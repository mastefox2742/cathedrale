'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPin, Phone, Mail, MessageCircle, Check, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useParoisse } from '../contexts/ParoisseContext'
import { getParoisseBySlug, rejoindreParoisse, type Paroisse } from '../services/paroisses'
import { supabase } from '../services/supabase'
import { VideoCard } from '../components/VideoCard'
import type { Evenement } from '../services/evenements'

interface AnnonceParoisse { id: string; titre: string; description: string; date: string; tag: string }
interface GroupeParoisse { id: string; titre: string; icon: string; horaire: string | null }
interface HomelieParoisse { id: string; titre: string; pretre: string; date: string }

export function ParoissePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, appartenances, refresh } = useAuth()
  const { courante, choisir } = useParoisse()
  const [paroisse, setParoisse] = useState<Paroisse | null>(null)
  const [annonces, setAnnonces] = useState<AnnonceParoisse[]>([])
  const [groupes, setGroupes] = useState<GroupeParoisse[]>([])
  const [videos, setVideos] = useState<Evenement[]>([])
  const [homelies, setHomelies] = useState<HomelieParoisse[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    getParoisseBySlug(slug).then(async p => {
      setParoisse(p)
      if (!p) return
      // Contenus propres à cette paroisse (indépendamment de la paroisse choisie dans l'en-tête).
      const [a, g, v, h] = await Promise.all([
        supabase.from('annonces').select('id, titre, description, date, tag').eq('parish_id', p.id).eq('publie', true).order('date', { ascending: false }).limit(4),
        supabase.from('groupes').select('id, titre, icon, horaire').eq('parish_id', p.id).eq('publie', true).order('titre'),
        supabase.from('evenements').select('*').eq('parish_id', p.id).eq('publie', true).order('date', { ascending: false }).limit(3),
        supabase.from('homelies').select('id, titre, pretre, date').eq('parish_id', p.id).eq('publie', true).order('date', { ascending: false }).limit(4),
      ])
      setAnnonces(a.data ?? [])
      setGroupes(g.data ?? [])
      setVideos((v.data ?? []).map(r => ({
        id: r.id, titre: r.titre, description: r.description, type: r.type, platform: r.platform, url: r.url,
        videoId: r.video_id ?? undefined, thumbnail: r.thumbnail ?? undefined, date: r.date, heure: r.heure ?? undefined,
        publie: r.publie, theme: r.theme ?? undefined, intervenant: r.intervenant ?? undefined,
      })))
      setHomelies(h.data ?? [])
    }).catch(() => setParoisse(null)).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div style={{ padding: '120px 20px', textAlign: 'center' }}><div className="page-loader-ring" style={{ margin: '0 auto' }} /></div>

  if (!paroisse) {
    return (
      <div style={{ padding: '140px 20px 80px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: 'var(--text-light)', marginBottom: 20 }}>Paroisse introuvable.</p>
        <Link href="/paroisses" className="btn-gold">Annuaire des paroisses</Link>
      </div>
    )
  }

  const estCourante = courante?.id === paroisse.id
  const estMembre = appartenances.some(a => a.parishId === paroisse.id)
  const h = paroisse.horaires
  const carte = paroisse.latitude != null && paroisse.longitude != null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${paroisse.longitude - 0.006}%2C${paroisse.latitude - 0.004}%2C${paroisse.longitude + 0.006}%2C${paroisse.latitude + 0.004}&layer=mapnik&marker=${paroisse.latitude}%2C${paroisse.longitude}`
    : null

  async function rejoindre() {
    if (!paroisse) return
    try {
      await rejoindreParoisse(paroisse.id)
      await refresh()
      setNotice('Vous êtes maintenant membre de cette paroisse.')
    } catch {
      setNotice('Une erreur est survenue. Merci de réessayer.')
    }
  }

  const contacts = [
    paroisse.adresse && { icon: MapPin, label: 'Adresse', value: [paroisse.adresse, paroisse.quartier, paroisse.ville].filter(Boolean).join(', '), href: carte ? `https://www.openstreetmap.org/?mlat=${paroisse.latitude}&mlon=${paroisse.longitude}#map=17/${paroisse.latitude}/${paroisse.longitude}` : undefined },
    paroisse.telephone && { icon: Phone, label: 'Téléphone', value: paroisse.telephone, href: `tel:${paroisse.telephone.replace(/\s/g, '')}` },
    paroisse.email && { icon: Mail, label: 'Email', value: paroisse.email, href: `mailto:${paroisse.email}` },
    paroisse.whatsapp && { icon: MessageCircle, label: 'WhatsApp', value: paroisse.whatsapp, href: `https://wa.me/${paroisse.whatsapp.replace(/\D/g, '')}` },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string }[]

  return (
    <>
      <div className="page-hero" style={paroisse.photoUrl ? { backgroundImage: `linear-gradient(120deg, rgba(18,59,93,.9), rgba(18,59,93,.6)), url('${paroisse.photoUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Paroisse · {paroisse.ville}</p>
          <h1><em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>{paroisse.nom}</em></h1>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl) 0' }}>
        <div className="inner" style={{ maxWidth: 960 }}>
          <div className="reveal" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
            {estCourante ? (
              <span className="btn-outline" style={{ fontSize: 10, cursor: 'default' }}><Check size={13} /> Paroisse affichée sur le site</span>
            ) : (
              <button onClick={() => choisir(paroisse.id)} className="btn-gold" style={{ fontSize: 10 }}>Afficher cette paroisse sur le site</button>
            )}
            {user && !estMembre && (
              <button onClick={rejoindre} className="btn-outline" style={{ fontSize: 10 }}><UserPlus size={13} /> Devenir membre</button>
            )}
            {user && estMembre && <span style={{ fontSize: 12, color: 'var(--blue)', alignSelf: 'center' }}>✓ Vous êtes membre de cette paroisse</span>}
          </div>
          {notice && <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: -20, marginBottom: 24 }}>{notice}</p>}

          <div className="grid-2" style={{ gap: 'clamp(24px,4vw,56px)', alignItems: 'start' }}>
            <div>
              {paroisse.description && (
                <p className="reveal" style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: 28 }}>{paroisse.description}</p>
              )}
              {paroisse.cure && <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 28 }}>Curé : <strong>{paroisse.cure}</strong></p>}

              <span className="section-label">Horaires des messes</span>
              {h.messes && h.messes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '12px 0 20px' }}>
                  {h.messes.map(m => (
                    <div key={m.jour} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{m.jour}</span>
                      <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, textAlign: 'right' }}>{m.horaires.join(' · ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-light)', margin: '12px 0 20px' }}>Horaires non renseignés. Contactez la paroisse.</p>
              )}
              {h.confessions && <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 6 }}>🤝 Confessions : {h.confessions}</p>}
              {h.permanence && <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>🕰️ Permanence : {h.permanence}</p>}
            </div>

            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
                {contacts.map(c => (
                  <a key={c.label} href={c.href} target={c.href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                    style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 18px', background: 'var(--bg-alt)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                    <c.icon size={17} color="var(--primary)" />
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{c.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.value}</p>
                    </div>
                  </a>
                ))}
              </div>
              {carte && (
                <iframe title={`Plan — ${paroisse.nom}`} src={carte} loading="lazy"
                  style={{ width: '100%', aspectRatio: '4/3', border: '1px solid var(--border)' }} />
              )}
            </div>
          </div>

          {annonces.length > 0 && (
            <section style={{ marginTop: 'var(--space-xl)' }}>
              <span className="section-label">Actualités de la paroisse</span>
              {annonces.map(a => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 18, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 26, fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{new Date(a.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit' })}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>{new Date(a.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</div>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{a.titre}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>{a.description}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {videos.length > 0 && (
            <section style={{ marginTop: 'var(--space-lg)' }}>
              <span className="section-label">Vidéos de la paroisse</span>
              <div className="grid-3" style={{ marginTop: 12 }}>
                {videos.map(v => <VideoCard key={v.id} ev={v} />)}
              </div>
            </section>
          )}

          {homelies.length > 0 && (
            <section style={{ marginTop: 'var(--space-lg)' }}>
              <span className="section-label">Homélies</span>
              {homelies.map(h => (
                <Link key={h.id} href="/homelies" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 15, color: 'var(--text)' }}>{h.titre}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>{h.pretre} · {new Date(h.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </Link>
              ))}
            </section>
          )}

          {groupes.length > 0 && (
            <section style={{ marginTop: 'var(--space-lg)' }}>
              <span className="section-label">Groupes &amp; activités</span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                {groupes.map(g => (
                  <span key={g.id} style={{ padding: '8px 14px', background: 'var(--bg-alt)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text)' }}>
                    {g.icon} {g.titre}{g.horaire ? ` · ${g.horaire}` : ''}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
