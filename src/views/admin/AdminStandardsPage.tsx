'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDroits } from '../../contexts/AuthContext'
import { isDiocesanAdmin, canEditStandards, type Role } from '../../services/auth'
import { getMonArchidiocese, majArchidiocese, getChartes, majCharte, type Archidiocese, type Charte } from '../../services/archidiocese'
import { setPerimetreAdmin, ARCHIDIOCESE } from '../../services/scope'
import { PageAdmin, Chargement, Vide, FField, Pastille, inp, useToast } from '../../components/admin/ui'

function peutEditerCharte(c: Charte, roles: Role[]): boolean {
  if (isDiocesanAdmin(roles)) return true
  return (c.slug === 'media' && roles.includes('responsable_media_diocesain'))
    || (c.slug === 'protection-mineurs' && roles.includes('responsable_securite'))
}

export function AdminStandardsPage() {
  const droits = useDroits()
  const toast = useToast()
  const [archidiocese, setArchidiocese] = useState<Archidiocese | null>(null)
  const [presentation, setPresentation] = useState('')
  const [histoire, setHistoire] = useState('')
  const [chartes, setChartes] = useState<Charte[]>([])
  const [edition, setEdition] = useState<Record<string, { titre: string; contenu: string; publie: boolean }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const a = await getMonArchidiocese()
      setArchidiocese(a)
      setPresentation(a?.presentation ?? '')
      setHistoire(a?.histoire ?? '')
      if (a) {
        const c = await getChartes(a.id)
        setChartes(c)
        setEdition(Object.fromEntries(c.map(x => [x.id, { titre: x.titre, contenu: x.contenu, publie: x.publie }])))
      }
    } catch { toast.show('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  if (!canEditStandards(droits.roles)) {
    return <PageAdmin titre="Standards & chartes"><Vide icone="lock" texte="Réservé à l'administration diocésaine et aux responsables diocésains." /></PageAdmin>
  }

  async function enregistrerHistoire() {
    if (!archidiocese) return
    setSaving('histoire')
    try { await majArchidiocese(archidiocese.id, { presentation, histoire }); toast.show('Histoire mise à jour ✓') }
    catch { toast.show('Erreur sauvegarde', 'err') }
    finally { setSaving(null) }
  }

  async function enregistrerCharte(c: Charte) {
    setSaving(c.id)
    try { await majCharte(c, edition[c.id]); toast.show('Charte enregistrée ✓'); await load() }
    catch { toast.show('Erreur sauvegarde', 'err') }
    finally { setSaving(null) }
  }

  function travaillerAuNiveauDiocesain(chemin: string) {
    setPerimetreAdmin(ARCHIDIOCESE)
    window.location.assign(chemin)
  }

  return (
    <PageAdmin titre="Standards & chartes" sousTitre={archidiocese?.nom ?? 'Archidiocèse'} maxWidth={960}>
      {toast.node}
      {loading ? <Chargement /> : (
        <>
          {/* Standards communs à toutes les paroisses */}
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 12 }}>Contenus de référence de l&apos;archidiocèse</h2>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 14 }}>
              Créés au niveau « Tout l&apos;archidiocèse », ils sont visibles dans toutes les paroisses, qui peuvent les dupliquer pour les adapter.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {droits.peutArchidiocese && (
                <>
                  <button className="btn-outline" onClick={() => travaillerAuNiveauDiocesain('/admin/catechisme')}>Programmes de catéchèse de référence</button>
                  <button className="btn-outline" onClick={() => travaillerAuNiveauDiocesain('/admin/parcours')}>Parcours de foi de référence</button>
                  <button className="btn-outline" onClick={() => travaillerAuNiveauDiocesain('/admin/annonces')}>Annonces globales</button>
                </>
              )}
              <Link href="/admin/registre" className="btn-outline">Registre des catéchistes</Link>
            </div>
          </div>

          {/* Histoire de l'archidiocèse */}
          {isDiocesanAdmin(droits.roles) && archidiocese && (
            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)', marginBottom: 12 }}>
                Histoire de l&apos;archidiocèse <a href="/histoire-archidiocese" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', fontFamily: 'var(--font-sans)' }}>voir la page ↗</a>
              </h2>
              <FField label="Présentation (une phrase, reprise sur l'accueil)">
                <textarea value={presentation} onChange={e => setPresentation(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
              </FField>
              <FField label="Histoire" aide="Mise en forme : ## titre, > citation, - liste, **gras**">
                <textarea value={histoire} onChange={e => setHistoire(e.target.value)} rows={14} style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
              </FField>
              <button className="btn-primary" onClick={enregistrerHistoire} disabled={saving === 'histoire'}>{saving === 'histoire' ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          )}

          {/* Chartes */}
          {chartes.filter(c => peutEditerCharte(c, droits.roles)).map(c => {
            const e = edition[c.id]
            return (
              <div key={c.id} className="card" style={{ padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--primary)' }}>{c.titre}</h2>
                  <Pastille texte={`Version ${c.version}`} ton="gris" />
                  <Pastille texte={c.publie ? 'Publiée' : 'Brouillon'} ton={c.publie ? 'vert' : 'orange'} />
                  <a href={`/chartes/${c.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)' }}>voir la page ↗</a>
                </div>
                <FField label="Titre"><input value={e.titre} onChange={ev => setEdition(x => ({ ...x, [c.id]: { ...e, titre: ev.target.value } }))} style={inp} /></FField>
                <FField label="Texte" aide="Chaque modification du texte crée une nouvelle version.">
                  <textarea value={e.contenu} onChange={ev => setEdition(x => ({ ...x, [c.id]: { ...e, contenu: ev.target.value } }))} rows={14} style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
                </FField>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
                  <input type="checkbox" checked={e.publie} onChange={ev => setEdition(x => ({ ...x, [c.id]: { ...e, publie: ev.target.checked } }))} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                  <span style={{ fontSize: 14 }}>Publiée (après adoption officielle)</span>
                </label>
                <button className="btn-primary" onClick={() => enregistrerCharte(c)} disabled={saving === c.id}>{saving === c.id ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            )
          })}
        </>
      )}
    </PageAdmin>
  )
}
