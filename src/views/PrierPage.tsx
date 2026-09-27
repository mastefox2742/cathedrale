'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { BookOpen, Feather, Clock3, Sparkles, HandHeart, Flame, Users, Church, ArrowRight } from 'lucide-react'
import { getIntentionsPubliques } from '../services/prieres'
import { getParcoursPublies } from '../services/parcours'
import { getGroupes } from '../services/groupes'
import { getHomelies, type Homelie } from '../services/homelies'
import { OFFICES, officeDuMoment, mysteresDuJour } from '../lib/priere'

interface CartePriere {
  href: string
  icone: ReactNode
  couleur: string
  label: string
  titre: string
  texte: string
  detail?: string | null
  bouton: string
  principal?: boolean
}

function Carte({ c }: { c: CartePriere }) {
  return (
    <Link href={c.href} className="reveal dark-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14, textDecoration: 'none' }}>
      <div className="icon-tile" style={{ background: c.couleur, color: '#fff' }}>{c.icone}</div>
      <span className="section-label">{c.label}</span>
      <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 19, fontWeight: 600, color: 'var(--text)', marginTop: -6 }}>{c.titre}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.7, flex: 1 }}>{c.texte}</p>
      {c.detail && <p style={{ fontSize: 11, color: 'var(--accent-dark)', fontWeight: 700 }}>{c.detail}</p>}
      <span className={c.principal ? 'btn-gold' : 'btn-outline'} style={{ alignSelf: 'flex-start', fontSize: c.principal ? undefined : 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {c.bouton} <ArrowRight size={13} />
      </span>
    </Link>
  )
}

function Groupe({ label, titre, cartes, fond }: { label: string; titre: string; cartes: CartePriere[]; fond: string }) {
  return (
    <section style={{ padding: 'var(--space-xl) 0', background: fond }}>
      <div className="inner">
        <div className="reveal" style={{ marginBottom: 28 }}>
          <span className="section-label">{label}</span>
          <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 700, color: 'var(--text)' }}>{titre}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'clamp(16px,2.5vw,24px)' }}>
          {cartes.map(c => <Carte key={c.href} c={c} />)}
        </div>
      </div>
    </section>
  )
}

export function PrierPage() {
  const [meditation, setMeditation] = useState<Homelie | null>(null)
  const [nbIntentions, setNbIntentions] = useState<number | null>(null)
  const [nbNeuvaines, setNbNeuvaines] = useState<number | null>(null)
  const [nbGroupes, setNbGroupes] = useState<number | null>(null)

  const mysteres = mysteresDuJour(new Date().getDay())
  const office = OFFICES.find(o => o.key === officeDuMoment())!

  useEffect(() => {
    getHomelies().then(h => setMeditation(h[0] ?? null)).catch(() => setMeditation(null))
    getIntentionsPubliques().then(i => setNbIntentions(i.length)).catch(() => setNbIntentions(null))
    getParcoursPublies(['neuvaine', 'retraite']).then(p => setNbNeuvaines(p.length)).catch(() => setNbNeuvaines(null))
    getGroupes().then(g => setNbGroupes(g.filter(x => ['priere', 'biblique', 'liturgie'].includes(x.categorie)).length)).catch(() => setNbGroupes(null))
  }, [])

  const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

  const aujourdhui: CartePriere[] = [
    {
      href: '/liturgie', icone: <BookOpen size={22} />, couleur: 'var(--primary)', label: 'Évangile du jour', titre: 'La Parole de ce jour',
      texte: "Les lectures de la messe du jour, d'après la traduction liturgique officielle (AELF).",
      bouton: "Lire l'Évangile du jour", principal: true,
    },
    {
      href: '/homelies', icone: <Feather size={22} />, couleur: 'var(--accent-dark)', label: 'Méditation', titre: meditation?.titre ?? 'Méditation de la semaine',
      texte: meditation ? `${meditation.texte.slice(0, 140)}${meditation.texte.length > 140 ? '…' : ''}` : 'Homélies et méditations des prêtres de la paroisse, à lire ou à réécouter.',
      detail: meditation?.pretre ?? null, bouton: 'Lire la méditation',
    },
    {
      href: '/prier/liturgie-des-heures', icone: <Clock3 size={22} />, couleur: 'var(--blue)', label: 'Liturgie des heures', titre: "Prier avec l'Église",
      texte: 'Laudes, milieu du jour, vêpres et complies : la prière qui rythme la journée de toute l’Église.',
      detail: `En ce moment : ${office.label} · ${office.moment}`, bouton: "Prier l'office",
    },
    {
      href: '/prier/chapelet', icone: <Sparkles size={22} />, couleur: 'var(--liturgy-purple, #6a1b9a)', label: 'Chapelet du jour', titre: mysteres.nom,
      texte: 'Méditer la vie du Christ avec Marie : les cinq mystères du jour et la manière de prier le chapelet.',
      detail: mysteres.liste[0] + '…', bouton: 'Prier le chapelet',
    },
  ]

  const communaute: CartePriere[] = [
    {
      href: '/prier/mur', icone: <HandHeart size={22} />, couleur: 'var(--primary)', label: 'Mur de prière', titre: 'Confier une intention',
      texte: 'Déposez une intention de prière et priez pour celles des autres fidèles.',
      detail: nbIntentions ? `${pluriel(nbIntentions, 'intention')} en ce moment` : null, bouton: 'Ouvrir le mur de prière',
    },
    {
      href: '/prier/neuvaines', icone: <Flame size={22} />, couleur: 'var(--accent-dark)', label: 'Neuvaines & retraites', titre: 'Prier plusieurs jours',
      texte: 'Neuf jours de prière confiante ou une retraite spirituelle en ligne, à votre rythme.',
      detail: nbNeuvaines ? `${pluriel(nbNeuvaines, 'proposition')} en ligne` : null, bouton: 'Voir les neuvaines',
    },
    {
      href: '/prier/groupes', icone: <Users size={22} />, couleur: 'var(--blue)', label: 'Groupes de prière', titre: 'Prier ensemble',
      texte: 'Prière, partage biblique, liturgie : rejoignez un groupe de votre paroisse.',
      detail: nbGroupes ? pluriel(nbGroupes, 'groupe') : null, bouton: 'Trouver un groupe',
    },
    {
      href: '/horaires', icone: <Church size={22} />, couleur: 'var(--primary)', label: 'Messes & confessions', titre: 'Horaires de la paroisse',
      texte: 'Messes de la semaine et du dimanche, permanences de confession.',
      bouton: 'Voir les horaires',
    },
  ]

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Vie de prière</p>
          <h1>Je veux <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>prier</em></h1>
        </div>
      </div>

      <Groupe label="Aujourd'hui" titre="Prier aujourd'hui" cartes={aujourdhui} fond="var(--surface)" />
      <Groupe label="En communauté" titre="Prier avec les autres" cartes={communaute} fond="var(--bg-alt)" />
    </>
  )
}
