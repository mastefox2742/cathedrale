'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useNavigate } from '../../lib/navigation'
import { useAuth, useDroits } from '../../contexts/AuthContext'
import {
  getStatsTableauDeBord, getStatsParParoisse, getSeriesTableauDeBord,
  type StatsTableauDeBord, type StatsParoisse, type SeriesTableauDeBord,
} from '../../services/stats'
import { formatXAF, TYPE_DON_LABELS } from '../../services/dons'
import { TYPE_DEMANDE_LABELS, STATUT_DEMANDE_LABELS, type TypeDemande, type StatutDemande } from '../../services/demandesPastorales'
import { getStatsParcours } from '../../services/parcours'
import { getToutesParoisses } from '../../services/paroisses'
import { supabase } from '../../services/supabase'
import { ARCHIDIOCESE } from '../../services/scope'
import { thStyle, tdStyle } from '../../components/admin/ui'

/* Palette de l'administration (mêmes teintes que les pastilles existantes). */
const C = {
  primary: '#00236f', gold: '#C9A227', vert: '#2e7d32', violet: '#6a1b9a',
  rouge: '#c62828', bleu: '#3E7CB1', orange: '#e65100', bronze: '#735c00',
  grille: '#e7e3e2', texte: '#444651',
}
const SERIE = [C.primary, C.gold, C.vert, C.violet, C.bleu, C.orange, C.rouge, C.bronze, '#00897b']

const nf = new Intl.NumberFormat('fr-FR')
const compact = (n: number) => n >= 1_000_000 ? `${nf.format(Math.round(n / 100_000) / 10)} M` : n >= 1000 ? `${nf.format(Math.round(n / 100) / 10)} k` : nf.format(n)

const tooltipStyle = {
  contentStyle: { borderRadius: 10, border: '1px solid #e7e3e2', boxShadow: '0 6px 20px rgba(0,0,0,.08)', fontSize: 12 },
  labelStyle: { fontWeight: 700, color: C.primary, marginBottom: 4 },
}

function Carte({ titre, sous, children, large, action }: { titre: string; sous?: string; children: ReactNode; large?: boolean; action?: ReactNode }) {
  return (
    <section className={`card tdb-carte${large ? ' tdb-large' : ''}`} style={{ padding: '18px 20px 14px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>{titre}</h3>
          {sous && <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>{sous}</p>}
        </div>
        {action}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </section>
  )
}

function Vide({ hauteur = 240, texte = 'Pas encore de données sur la période.' }: { hauteur?: number; texte?: string }) {
  return (
    <div style={{ height: hauteur, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--on-surface-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.4 }}>monitoring</span>
      <p style={{ fontSize: 12 }}>{texte}</p>
    </div>
  )
}

/** Petite courbe de tendance dans les indicateurs. */
function Tendance({ data, champ, couleur }: { data: Record<string, number | string>[]; champ: string; couleur: string }) {
  return (
    <div style={{ height: 38, marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`t-${champ}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={couleur} stopOpacity={0.35} />
              <stop offset="100%" stopColor={couleur} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={champ} stroke={couleur} strokeWidth={2} fill={`url(#t-${champ})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function Donut({ data, total, libelleTotal, decalage = 0 }: { data: { nom: string; valeur: number }[]; total: string; libelleTotal: string; decalage?: number }) {
  const couleur = (i: number) => SERIE[(i + decalage) % SERIE.length]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 190, height: 190, flexShrink: 0, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="valeur" nameKey="nom" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={couleur(i)} />)}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v) => nf.format(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 700, color: C.primary, lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: 11, color: C.texte, marginTop: 2 }}>{libelleTotal}</span>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <li key={d.nom} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: couleur(i), flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--on-surface)' }}>{d.nom}</span>
            <strong style={{ color: C.primary }}>{nf.format(d.valeur)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardPage() {
  const { profile } = useAuth()
  const droits = useDroits()
  const navigate = useNavigate()
  const [stats, setStats] = useState<StatsTableauDeBord | null>(null)
  const [series, setSeries] = useState<SeriesTableauDeBord | null>(null)
  const [parcours, setParcours] = useState<{ titre: string; inscrits: number; termines: number }[]>([])
  const [parParoisse, setParParoisse] = useState<StatsParoisse[]>([])
  const [perimetreNom, setPerimetreNom] = useState('')
  const [loadingStats, setLoadingStats] = useState(true)
  const [erreur, setErreur] = useState(false)
  const [voirTableau, setVoirTableau] = useState(false)
  const toutArchidiocese = droits.perimetre === ARCHIDIOCESE

  useEffect(() => {
    getStatsTableauDeBord()
      .then(setStats)
      .catch(() => setErreur(true))
      .finally(() => setLoadingStats(false))
    getSeriesTableauDeBord().then(setSeries).catch(() => setSeries(null))
    getStatsParcours()
      .then(async m => {
        const ids = [...m.keys()]
        if (!ids.length) return setParcours([])
        const { data } = await supabase.from('evangelization_paths').select('id, titre').in('id', ids)
        const titres = new Map((data ?? []).map(p => [p.id as string, p.titre as string]))
        setParcours(ids.map(id => ({ titre: titres.get(id) ?? '—', ...m.get(id)! }))
          .filter(p => p.inscrits > 0).sort((a, b) => b.inscrits - a.inscrits).slice(0, 8))
      })
      .catch(() => setParcours([]))
    if (toutArchidiocese) {
      setPerimetreNom("Tout l'archidiocèse")
      getStatsParParoisse().then(setParParoisse).catch(() => setParParoisse([]))
    } else if (droits.perimetre) {
      getToutesParoisses().then(p => setPerimetreNom(p.find(x => x.id === droits.perimetre)?.nom ?? '')).catch(() => {})
    }
  }, [toutArchidiocese, droits.perimetre])

  const mois = series?.mois ?? []
  const activiteVide = mois.every(m => !m.inscriptions && !m.demarches && !m.intentions && !m.temoignages)
  const donsVides = mois.every(m => !m.dons)
  const typesDons = useMemo(() => Object.keys(series?.donsParType ?? {}), [series])

  const demarchesType = Object.entries(series?.demarchesParType ?? {})
    .map(([k, v]) => ({ nom: TYPE_DEMANDE_LABELS[k as TypeDemande] ?? k, valeur: v })).sort((a, b) => b.valeur - a.valeur)
  const demarchesStatut = Object.entries(series?.demarchesParStatut ?? {})
    .map(([k, v]) => ({ nom: STATUT_DEMANDE_LABELS[k as StatutDemande] ?? k, valeur: v }))
  const totalDemarches = demarchesType.reduce((t, d) => t + d.valeur, 0)

  const aTraiter = [
    { nom: 'Intentions de prière', valeur: stats?.intentions_recues ?? 0, couleur: C.violet, to: '/admin/intentions' },
    { nom: 'Démarches reçues', valeur: stats?.demandes_recues ?? 0, couleur: C.primary, to: '/admin/demarches' },
    { nom: 'Témoignages à modérer', valeur: stats?.temoignages_attente ?? 0, couleur: C.orange, to: '/admin/temoignages' },
    { nom: 'Adhésions aux groupes', valeur: stats?.adhesions_nouvelles ?? 0, couleur: C.bleu, to: '/admin/groupes' },
    { nom: 'Dons à vérifier', valeur: stats?.dons_en_attente ?? 0, couleur: C.vert, to: '/admin/dons' },
    ...(stats?.signalements_nouveaux != null ? [{ nom: 'Signalements', valeur: stats.signalements_nouveaux, couleur: C.rouge, to: '/admin/signalements' }] : []),
  ]
  const totalATraiter = aTraiter.reduce((t, a) => t + a.valeur, 0)

  const KPIS = [
    { label: 'Fidèles inscrits', value: stats ? nf.format(stats.fideles) : undefined, sub: `${stats?.abonnes ?? '—'} abonnés aux actualités`, couleur: C.primary, champ: 'inscriptions', to: '/admin/utilisateurs' },
    { label: 'Dons confirmés', value: stats ? formatXAF(stats.dons_total) : undefined, sub: `${stats?.dons_en_attente ?? '—'} en attente`, couleur: C.vert, champ: 'dons', to: '/admin/dons' },
    { label: 'Démarches pastorales', value: stats ? nf.format(totalDemarches) : undefined, sub: 'Sur les 12 derniers mois', couleur: C.gold, champ: 'demarches', to: '/admin/demarches' },
    { label: 'Intentions de prière', value: stats ? nf.format(mois.reduce((t, m) => t + m.intentions, 0)) : undefined, sub: 'Sur les 12 derniers mois', couleur: C.violet, champ: 'intentions', to: '/admin/intentions' },
  ]

  const presence = stats?.presence_moyenne ?? null
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1240 }}>
      <style>{`
        .tdb-grille { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-bottom: 18px; }
        .tdb-large { grid-column: span 2; }
        .tdb-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
        @media (max-width: 1100px) { .tdb-grille { grid-template-columns: repeat(2, minmax(0, 1fr)); } .tdb-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) { .tdb-grille, .tdb-kpis { grid-template-columns: 1fr; } .tdb-large { grid-column: auto; } }
        .tdb-kpi { cursor: pointer; transition: transform .18s, box-shadow .18s; }
        .tdb-kpi:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
      `}</style>

      {/* ── En-tête ── */}
      <div style={{
        marginBottom: 24, padding: '24px 28px',
        background: 'linear-gradient(135deg, var(--primary) 0%, #1a3a9a 100%)',
        borderRadius: 16, color: 'white', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.07 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 180, fontVariationSettings: "'FILL' 1" }}>monitoring</span>
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 4 }}>
            {greeting}, {profile?.nom?.split(' ')[0] || 'Admin'}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            Tableau statistique · {perimetreNom || 'Archidiocèse de Brazzaville'}
          </p>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 28 }}>
          {[
            ...(toutArchidiocese ? [{ v: stats?.paroisses, l: 'paroisses' }] : []),
            { v: stats?.catechistes, l: 'catéchistes' },
            { v: stats?.enfants, l: 'enfants suivis' },
            { v: stats?.videos, l: 'vidéos' },
          ].map(x => (
            <div key={x.l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{loadingStats ? '…' : nf.format(x.v ?? 0)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      {erreur && (
        <p style={{ fontSize: 13, color: C.rouge, marginBottom: 16 }}>
          Les statistiques n'ont pas pu être chargées. Vérifiez que les migrations de la base sont appliquées.
        </p>
      )}

      {/* ── Indicateurs avec tendance ── */}
      <div className="tdb-kpis">
        {KPIS.map(k => (
          <div key={k.label} className="card tdb-kpi" onClick={() => navigate(k.to)} style={{ padding: '16px 18px 10px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{k.label}</p>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: k.couleur, lineHeight: 1.15, marginTop: 6 }}>
              {loadingStats ? '…' : (k.value ?? '—')}
            </p>
            <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{k.sub}</p>
            <Tendance data={mois} champ={k.champ} couleur={k.couleur} />
          </div>
        ))}
      </div>

      {/* ── Activité + démarches ── */}
      <div className="tdb-grille">
        <Carte titre="Activité sur 12 mois" sous="Nouvelles inscriptions, démarches, intentions et témoignages reçus" large>
          {activiteVide ? <Vide hauteur={280} /> : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mois} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    {[['inscriptions', C.primary], ['demarches', C.gold], ['intentions', C.violet], ['temoignages', C.orange]].map(([k, c]) => (
                      <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke={C.grille} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="inscriptions" name="Inscriptions" stroke={C.primary} strokeWidth={2.5} fill="url(#g-inscriptions)" />
                  <Area type="monotone" dataKey="demarches" name="Démarches" stroke={C.gold} strokeWidth={2.5} fill="url(#g-demarches)" />
                  <Area type="monotone" dataKey="intentions" name="Intentions" stroke={C.violet} strokeWidth={2.5} fill="url(#g-intentions)" />
                  <Area type="monotone" dataKey="temoignages" name="Témoignages" stroke={C.orange} strokeWidth={2.5} fill="url(#g-temoignages)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Carte>

        <Carte titre="Démarches par type" sous="12 derniers mois">
          {demarchesType.length === 0 ? <Vide /> : <Donut data={demarchesType} total={nf.format(totalDemarches)} libelleTotal="démarches" />}
        </Carte>
      </div>

      {/* ── Dons + présence ── */}
      <div className="tdb-grille">
        <Carte titre="Dons confirmés par mois" sous="Montants en francs CFA, par type de don" large
          action={<strong style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: C.vert }}>{stats ? formatXAF(mois.reduce((t, m) => t + m.dons, 0)) : ''}</strong>}>
          {donsVides ? <Vide hauteur={260} texte="Aucun don confirmé sur la période." /> : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mois} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={C.grille} vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={v => compact(Number(v))} tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [formatXAF(Number(v)), n]} cursor={{ fill: 'rgba(0,35,111,.04)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  {typesDons.map((t, i) => (
                    <Bar key={t} dataKey={t} name={TYPE_DON_LABELS[t as keyof typeof TYPE_DON_LABELS]?.label ?? t} stackId="dons"
                      fill={SERIE[(i + 2) % SERIE.length]} radius={i === typesDons.length - 1 ? [6, 6, 0, 0] : 0} maxBarSize={38} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Carte>

        <Carte titre="Présence en catéchèse" sous="Taux moyen de présence aux séances">
          {presence == null ? <Vide texte="Aucune présence saisie pour l'instant." /> : (
            <div style={{ position: 'relative', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart data={[{ nom: 'Présence', valeur: presence }]} innerRadius="72%" outerRadius="100%" startAngle={210} endAngle={-30}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="valeur" cornerRadius={12} fill={presence >= 75 ? C.vert : presence >= 50 ? C.gold : C.rouge} background={{ fill: '#f0edec' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 40, fontWeight: 700, color: C.primary, lineHeight: 1 }}>{presence} %</span>
                <span style={{ fontSize: 12, color: C.texte, marginTop: 4 }}>{stats?.enfants ?? 0} enfants suivis</span>
              </div>
            </div>
          )}
        </Carte>
      </div>

      {/* ── À traiter + suivi + parcours + vidéos ── */}
      <div className="tdb-grille">
        <Carte titre="À traiter" sous={`${nf.format(totalATraiter)} élément${totalATraiter > 1 ? 's' : ''} en attente`}>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aTraiter} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="nom" width={140} tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(0,35,111,.04)' }} />
                <Bar dataKey="valeur" name="En attente" radius={[0, 6, 6, 0]} maxBarSize={22} label={{ position: 'right', fontSize: 12, fontWeight: 700, fill: C.primary }}
                  onClick={(d) => { const to = (d as unknown as { payload?: { to?: string } }).payload?.to; if (to) navigate(to) }} style={{ cursor: 'pointer' }}>
                  {aTraiter.map(a => <Cell key={a.nom} fill={a.couleur} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Carte>

        <Carte titre="Suivi des démarches" sous="Où en sont les demandes des fidèles">
          {demarchesStatut.length === 0 ? <Vide /> : <Donut data={demarchesStatut} total={nf.format(totalDemarches)} libelleTotal="au total" />}
        </Carte>

        <Carte titre="Vidéos les plus vues" sous={`${nf.format(stats?.vues_videos ?? 0)} lectures · ${stats?.heures_visionnage ?? 0} h de visionnage`}>
          {!series?.videos.length ? <Vide texte="Aucune lecture enregistrée." /> : (
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series.videos} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="titre" width={130} tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false}
                    tickFormatter={(t: string) => t.length > 20 ? t.slice(0, 19) + '…' : t} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(0,35,111,.04)' }} />
                  <Bar dataKey="vues" name="Lectures" fill={C.rouge} radius={[0, 6, 6, 0]} maxBarSize={20} label={{ position: 'right', fontSize: 11, fill: C.texte }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Carte>
      </div>

      <div className="tdb-grille">
        <Carte titre="Parcours de foi" sous={`${nf.format(stats?.parcours_inscrits ?? 0)} participations · personnes inscrites et ayant terminé`} large>
          {parcours.length === 0 ? <Vide hauteur={260} texte="Aucune participation aux parcours pour l'instant." /> : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parcours} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke={C.grille} vertical={false} />
                  <XAxis dataKey="titre" tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false} interval={0}
                    tickFormatter={(t: string) => t.length > 16 ? t.slice(0, 15) + '…' : t} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(0,35,111,.04)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="inscrits" name="Inscrits" fill={C.primary} radius={[6, 6, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="termines" name="Terminé" fill={C.gold} radius={[6, 6, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Carte>

        <Carte titre="Dons par type" sous="Montants confirmés, 12 derniers mois">
          {typesDons.length === 0 ? <Vide texte="Aucun don confirmé sur la période." /> : (
            <Donut
              data={typesDons.map(t => ({ nom: TYPE_DON_LABELS[t as keyof typeof TYPE_DON_LABELS]?.label ?? t, valeur: series!.donsParType[t] }))}
              total={compact(Object.values(series!.donsParType).reduce((a, b) => a + b, 0))}
              libelleTotal="XAF"
              decalage={2}
            />
          )}
        </Carte>
      </div>

      {/* ── Comparaison des paroisses (vue archidiocésaine) ── */}
      {toutArchidiocese && parParoisse.length > 0 && (
        <div className="tdb-grille" style={{ gridTemplateColumns: '1fr' }}>
          <Carte titre="Comparaison des paroisses" sous="Fidèles, catéchistes et enfants suivis"
            action={<button type="button" className="btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setVoirTableau(v => !v)}>
              {voirTableau ? 'Masquer le détail' : 'Voir le détail'}</button>}>
            <div style={{ height: Math.max(220, parParoisse.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parParoisse} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={C.grille} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.texte }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="nom" width={170} tick={{ fontSize: 12, fill: C.texte }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(0,35,111,.04)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="fideles" name="Fidèles" fill={C.primary} radius={[0, 5, 5, 0]} maxBarSize={14} />
                  <Bar dataKey="catechistes" name="Catéchistes" fill={C.gold} radius={[0, 5, 5, 0]} maxBarSize={14} />
                  <Bar dataKey="enfants" name="Enfants" fill={C.vert} radius={[0, 5, 5, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {voirTableau && (
              <div style={{ overflowX: 'auto', marginTop: 16 }}>
                <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-container)' }}>
                      {['Paroisse', 'Fidèles', 'Catéchistes', 'Enfants', 'Dons confirmés', 'Demandes', 'Catéchèse terminée'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {parParoisse.map(p => (
                      <tr key={p.parish_id}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{p.nom}</td>
                        <td style={tdStyle}>{p.fideles}</td>
                        <td style={tdStyle}>{p.catechistes}</td>
                        <td style={tdStyle}>{p.enfants}</td>
                        <td style={tdStyle}>{formatXAF(p.dons_total)}</td>
                        <td style={tdStyle}>{p.demandes_recues}</td>
                        <td style={tdStyle}>{p.parcours_termines}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Carte>
        </div>
      )}

      {/* ── Accès rapides ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        {[
          { label: 'Nouvelle annonce', icon: 'add_circle', to: '/admin/annonces', primary: true },
          { label: 'Programmer un direct', icon: 'live_tv', to: '/admin/tv', primary: true },
          { label: 'Envoyer une notification', icon: 'notifications', to: '/admin/notifications', primary: false },
          { label: 'Parcours de foi', icon: 'route', to: '/admin/parcours', primary: false },
        ].map(({ label, icon, to, primary }) => (
          <button key={label} onClick={() => navigate(to)} className={primary ? 'btn-primary' : 'btn-outline'} style={{ gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
