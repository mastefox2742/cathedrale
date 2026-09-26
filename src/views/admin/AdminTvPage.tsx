'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getAllDirects, createDirect, updateDirect, deleteDirect, getAllPlaylists, createPlaylist, updatePlaylist,
  deletePlaylist, setVideosPlaylist, getVideosPourPlaylist, STATUT_DIRECT_LABELS,
  type Direct, type DirectInput, type StatutDirect, type Playlist, type PlaylistInput,
} from '../../services/mediation'
import { getAllEvenements, addEvenement, PUBLIC_CIBLE_LABELS, type Evenement, type PublicCible } from '../../services/evenements'
import { slugify } from '../../services/paroisses'
import {
  PageAdmin, Chargement, Vide, Modale, BoutonsModale, FField, IconBtn, Pastille, ConfirmationSuppression, inp, useToast,
} from '../../components/admin/ui'

const DIRECT_VIDE: DirectInput = {
  titre: '', description: '', url: '', debut: '', fin: null, statut: 'programme', intervenant: '', theme: '', publie: true,
}

const PLAYLIST_VIDE: PlaylistInput = { titre: '', slug: '', description: '', publicCible: 'decouvre', ordre: 0, publie: false }

/** Convertit un ISO en valeur d'<input type="datetime-local"> (heure locale). */
function versLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function AdminTvPage() {
  const toast = useToast()
  const [onglet, setOnglet] = useState<'directs' | 'playlists'>('directs')
  const [directs, setDirects] = useState<Direct[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [videos, setVideos] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [direct, setDirect] = useState<Direct | 'nouveau' | null>(null)
  const [directForm, setDirectForm] = useState<DirectInput>(DIRECT_VIDE)
  const [playlist, setPlaylist] = useState<Playlist | 'nouvelle' | null>(null)
  const [playlistForm, setPlaylistForm] = useState<PlaylistInput>(PLAYLIST_VIDE)
  const [contenuDe, setContenuDe] = useState<Playlist | null>(null)
  const [saving, setSaving] = useState(false)
  const [suppr, setSuppr] = useState<{ type: 'direct' | 'playlist'; id: string; titre: string } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [d, p, v] = await Promise.all([getAllDirects(), getAllPlaylists(), getAllEvenements()])
      setDirects(d); setPlaylists(p); setVideos(v)
    } catch { toast.show('Erreur de chargement', 'err') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  function ouvrirDirect(d: Direct | null) {
    setDirectForm(d ? { ...d } : DIRECT_VIDE)
    setDirect(d ?? 'nouveau')
  }

  async function enregistrerDirect() {
    if (!directForm.titre.trim() || !directForm.url.trim() || !directForm.debut) return toast.show('Titre, lien et date de début obligatoires', 'err')
    setSaving(true)
    try {
      const data = { ...directForm, debut: new Date(directForm.debut).toISOString(), fin: directForm.fin ? new Date(directForm.fin).toISOString() : null }
      if (direct && direct !== 'nouveau') await updateDirect(direct.id, data)
      else await createDirect(data)
      toast.show('Direct enregistré ✓')
      setDirect(null)
      await load()
    } catch { toast.show('Erreur sauvegarde', 'err') }
    finally { setSaving(false) }
  }

  async function changerStatut(d: Direct, statut: StatutDirect) {
    try { await updateDirect(d.id, { statut }); await load() } catch { toast.show('Erreur', 'err') }
  }

  /** Un direct terminé devient un replay dans la bibliothèque vidéo. */
  async function versReplay(d: Direct) {
    try {
      const plateforme = /facebook\.com|fb\.watch/.test(d.url) ? 'facebook' : 'youtube'
      await addEvenement({
        titre: d.titre, description: d.description, type: 'replay', platform: plateforme, url: d.url,
        date: d.debut.slice(0, 10), heure: new Date(d.debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        publie: true, theme: d.theme ?? undefined, intervenant: d.intervenant ?? undefined,
      })
      await updateDirect(d.id, { statut: 'termine' })
      toast.show('Replay ajouté à la bibliothèque ✓')
      await load()
    } catch { toast.show('Erreur', 'err') }
  }

  function ouvrirPlaylist(p: Playlist | null) {
    setPlaylistForm(p ? { titre: p.titre, slug: p.slug, description: p.description, publicCible: p.publicCible, ordre: p.ordre, publie: p.publie } : PLAYLIST_VIDE)
    setPlaylist(p ?? 'nouvelle')
  }

  async function enregistrerPlaylist() {
    if (!playlistForm.titre.trim()) return toast.show('Le titre est obligatoire', 'err')
    setSaving(true)
    try {
      const data = { ...playlistForm, slug: playlistForm.slug || slugify(playlistForm.titre) }
      if (playlist && playlist !== 'nouvelle') await updatePlaylist(playlist.id, data)
      else await createPlaylist(data)
      toast.show('Playlist enregistrée ✓')
      setPlaylist(null)
      await load()
    } catch (e) {
      toast.show(e instanceof Error && e.message.includes('duplicate') ? 'Ce lien (slug) est déjà utilisé' : 'Erreur sauvegarde', 'err')
    } finally { setSaving(false) }
  }

  async function supprimer() {
    if (!suppr) return
    try {
      if (suppr.type === 'direct') await deleteDirect(suppr.id)
      else await deletePlaylist(suppr.id)
      toast.show('Supprimé')
      setSuppr(null)
      await load()
    } catch { toast.show('Erreur suppression', 'err') }
  }

  const vuesTotales = videos.reduce((s, v) => s + (v.vues ?? 0), 0)

  return (
    <PageAdmin
      titre="Médiation / TV"
      sousTitre={<>Directs programmés et playlists de la chaîne · {videos.length} vidéo{videos.length > 1 ? 's' : ''} · {vuesTotales} lecture{vuesTotales > 1 ? 's' : ''} · <Link href="/admin/evenements" style={{ color: 'var(--primary)' }}>Gérer les vidéos</Link></>}
      action={
        <button className="btn-primary" onClick={() => onglet === 'directs' ? ouvrirDirect(null) : ouvrirPlaylist(null)} style={{ gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          {onglet === 'directs' ? 'Programmer un direct' : 'Nouvelle playlist'}
        </button>
      }
    >
      {toast.node}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['directs', 'playlists'] as const).map(o => (
          <button key={o} onClick={() => setOnglet(o)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: onglet === o ? 'var(--primary)' : 'var(--surface-container)', color: onglet === o ? 'white' : 'var(--on-surface-variant)',
          }}>{o === 'directs' ? `Directs (${directs.length})` : `Playlists (${playlists.length})`}</button>
        ))}
      </div>

      {loading ? <Chargement /> : onglet === 'directs' ? (
        directs.length === 0 ? <Vide icone="live_tv" texte="Aucun direct programmé." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {directs.map(d => (
              <div key={d.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>{d.titre}</p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{fmt(d.debut)}{d.intervenant ? ` · ${d.intervenant}` : ''}</p>
                </div>
                <Pastille texte={STATUT_DIRECT_LABELS[d.statut]} ton={d.statut === 'en_direct' ? 'rouge' : d.statut === 'termine' ? 'gris' : 'bleu'} />
                {!d.publie && <Pastille texte="Masqué" ton="gris" />}
                {d.statut === 'programme' && <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => changerStatut(d, 'en_direct')}>Passer en direct</button>}
                {d.statut === 'en_direct' && <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => versReplay(d)}>Terminer → replay</button>}
                <IconBtn icone="edit" titre="Modifier" ton="primaire" onClick={() => ouvrirDirect(d)} />
                <IconBtn icone="delete" titre="Supprimer" ton="danger" onClick={() => setSuppr({ type: 'direct', id: d.id, titre: d.titre })} />
              </div>
            ))}
          </div>
        )
      ) : (
        playlists.length === 0 ? <Vide icone="playlist_play" texte="Aucune playlist." /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {playlists.map(p => (
              <div key={p.id} className="card" style={{ padding: 20, opacity: p.publie ? 1 : 0.7 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 6 }}>{p.titre}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <Pastille texte={PUBLIC_CIBLE_LABELS[p.publicCible]} />
                  {p.parishId === null && <Pastille texte="Archidiocèse" ton="orange" />}
                  {!p.publie && <Pastille texte="Brouillon" ton="gris" />}
                </div>
                <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 14 }}>{p.evenementIds.length} vidéo{p.evenementIds.length > 1 ? 's' : ''}{p.description ? ` · ${p.description}` : ''}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn-outline" onClick={() => setContenuDe(p)} style={{ padding: '6px 12px', fontSize: 12 }}>Vidéos</button>
                  <IconBtn icone={p.publie ? 'visibility' : 'visibility_off'} titre={p.publie ? 'Dépublier' : 'Publier'} ton={p.publie ? 'succes' : 'neutre'} actif
                    onClick={async () => { try { await updatePlaylist(p.id, { publie: !p.publie }); await load() } catch { toast.show('Erreur', 'err') } }} />
                  <IconBtn icone="edit" titre="Modifier" ton="primaire" onClick={() => ouvrirPlaylist(p)} />
                  <IconBtn icone="delete" titre="Supprimer" ton="danger" onClick={() => setSuppr({ type: 'playlist', id: p.id, titre: p.titre })} />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {direct && (
        <Modale titre={direct === 'nouveau' ? 'Programmer un direct' : 'Modifier le direct'} onClose={() => setDirect(null)}>
          <FField label="Titre *"><input value={directForm.titre} onChange={e => setDirectForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ex : Messe dominicale en direct" style={inp} /></FField>
          <FField label="Lien du direct (YouTube ou Facebook) *"><input value={directForm.url} onChange={e => setDirectForm(f => ({ ...f, url: e.target.value }))} placeholder="https://youtube.com/live/…" style={inp} /></FField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FField label="Début *"><input type="datetime-local" value={versLocal(directForm.debut) || directForm.debut} onChange={e => setDirectForm(f => ({ ...f, debut: e.target.value }))} style={inp} /></FField>
            <FField label="Fin"><input type="datetime-local" value={versLocal(directForm.fin) || directForm.fin || ''} onChange={e => setDirectForm(f => ({ ...f, fin: e.target.value || null }))} style={inp} /></FField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <FField label="Intervenant"><input value={directForm.intervenant ?? ''} onChange={e => setDirectForm(f => ({ ...f, intervenant: e.target.value }))} style={inp} /></FField>
            <FField label="Thème"><input value={directForm.theme ?? ''} onChange={e => setDirectForm(f => ({ ...f, theme: e.target.value }))} style={inp} /></FField>
            <FField label="Statut">
              <select value={directForm.statut} onChange={e => setDirectForm(f => ({ ...f, statut: e.target.value as StatutDirect }))} style={inp}>
                {(Object.keys(STATUT_DIRECT_LABELS) as StatutDirect[]).map(s => <option key={s} value={s}>{STATUT_DIRECT_LABELS[s]}</option>)}
              </select>
            </FField>
          </div>
          <FField label="Description"><textarea value={directForm.description} onChange={e => setDirectForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} /></FField>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
            <input type="checkbox" checked={directForm.publie} onChange={e => setDirectForm(f => ({ ...f, publie: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            <span style={{ fontSize: 14 }}>Afficher dans le programme public</span>
          </label>
          <BoutonsModale onAnnuler={() => setDirect(null)} onValider={enregistrerDirect} enCours={saving} libelle="Enregistrer" />
        </Modale>
      )}

      {playlist && (
        <Modale titre={playlist === 'nouvelle' ? 'Nouvelle playlist' : 'Modifier la playlist'} onClose={() => setPlaylist(null)}>
          <FField label="Titre *"><input value={playlistForm.titre} onChange={e => setPlaylistForm(f => ({ ...f, titre: e.target.value }))} style={inp} /></FField>
          <FField label="Description"><textarea value={playlistForm.description} onChange={e => setPlaylistForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} /></FField>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 90px', gap: 16 }}>
            <FField label="Public visé">
              <select value={playlistForm.publicCible} onChange={e => setPlaylistForm(f => ({ ...f, publicCible: e.target.value as PublicCible }))} style={inp}>
                {(Object.keys(PUBLIC_CIBLE_LABELS) as PublicCible[]).map(p => <option key={p} value={p}>{PUBLIC_CIBLE_LABELS[p]}</option>)}
              </select>
            </FField>
            <FField label="Lien (slug)"><input value={playlistForm.slug} onChange={e => setPlaylistForm(f => ({ ...f, slug: slugify(e.target.value) }))} style={inp} /></FField>
            <FField label="Ordre"><input type="number" value={playlistForm.ordre} onChange={e => setPlaylistForm(f => ({ ...f, ordre: Number(e.target.value) }))} style={inp} /></FField>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20 }}>
            <input type="checkbox" checked={playlistForm.publie} onChange={e => setPlaylistForm(f => ({ ...f, publie: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            <span style={{ fontSize: 14 }}>Publier sur la chaîne</span>
          </label>
          <BoutonsModale onAnnuler={() => setPlaylist(null)} onValider={enregistrerPlaylist} enCours={saving} libelle="Enregistrer" />
        </Modale>
      )}

      {contenuDe && (
        <ContenuPlaylist playlist={contenuDe} onClose={async (saved) => { setContenuDe(null); if (saved) { toast.show('Playlist mise à jour ✓'); await load() } }} notifier={toast.show} />
      )}

      {suppr && <ConfirmationSuppression texte={`« ${suppr.titre} » sera définitivement supprimé.`} onAnnuler={() => setSuppr(null)} onConfirmer={supprimer} />}
    </PageAdmin>
  )
}

function ContenuPlaylist({ playlist, onClose, notifier }: {
  playlist: Playlist; onClose: (saved: boolean) => void; notifier: (m: string, t?: 'ok' | 'err') => void
}) {
  const [ids, setIds] = useState<string[]>(playlist.evenementIds)
  const [saving, setSaving] = useState(false)
  // Vidéos du périmètre + vidéos de l'archidiocèse (intégrables dans une playlist de paroisse).
  const [videos, setVideos] = useState<{ id: string; titre: string; date: string; diocesaine: boolean }[]>([])
  useEffect(() => { getVideosPourPlaylist().then(setVideos).catch(() => setVideos([])) }, [])
  const parId = new Map(videos.map(v => [v.id, v]))

  function deplacer(i: number, delta: number) {
    setIds(l => {
      const j = i + delta
      if (j < 0 || j >= l.length) return l
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]]
      return c
    })
  }

  async function enregistrer() {
    setSaving(true)
    try { await setVideosPlaylist(playlist.id, ids); onClose(true) }
    catch { notifier('Erreur sauvegarde', 'err') }
    finally { setSaving(false) }
  }

  return (
    <Modale titre={`Vidéos — ${playlist.titre}`} onClose={() => onClose(false)} maxWidth={680}>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Dans la playlist ({ids.length})</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {ids.length === 0 && <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Aucune vidéo. Ajoutez-en ci-dessous.</p>}
        {ids.map((id, i) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--surface-container)' }}>
            <span style={{ flex: 1, fontSize: 13 }}>{parId.get(id)?.titre ?? 'Vidéo supprimée'}</span>
            <IconBtn icone="arrow_upward" titre="Monter" onClick={() => deplacer(i, -1)} />
            <IconBtn icone="arrow_downward" titre="Descendre" onClick={() => deplacer(i, 1)} />
            <IconBtn icone="remove" titre="Retirer" ton="danger" onClick={() => setIds(l => l.filter(x => x !== id))} />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Bibliothèque vidéo</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto', marginBottom: 16 }}>
        {videos.filter(v => !ids.includes(v.id)).map(v => (
          <button key={v.id} onClick={() => setIds(l => [...l, v.id])} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--outline-variant)', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>add</span>
            <span style={{ flex: 1 }}>{v.titre}</span>
            {v.diocesaine && <Pastille texte="Archidiocèse" ton="orange" />}
            <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{v.date}</span>
          </button>
        ))}
      </div>
      <BoutonsModale onAnnuler={() => onClose(false)} onValider={enregistrer} enCours={saving} libelle="Enregistrer" />
    </Modale>
  )
}
