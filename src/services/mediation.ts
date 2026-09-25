import { supabase } from './supabase'
import { filtrePublic, filtreAdmin, parishIdPourCreation } from './scope'
import { logAudit } from './auditLog'
import type { PublicCible } from './evenements'

// ── Directs programmés ──────────────────────────────────────────────────────

export type StatutDirect = 'programme' | 'en_direct' | 'termine'

export const STATUT_DIRECT_LABELS: Record<StatutDirect, string> = {
  programme: 'Programmé',
  en_direct: 'En direct',
  termine: 'Terminé',
}

export interface Direct {
  id: string
  parishId: string | null
  titre: string
  description: string
  url: string
  debut: string
  fin: string | null
  statut: StatutDirect
  intervenant: string | null
  theme: string | null
  publie: boolean
}

export type DirectInput = Omit<Direct, 'id' | 'parishId'>

interface DirectRow {
  id: string; parish_id: string | null; titre: string; description: string; url: string
  debut: string; fin: string | null; statut: StatutDirect; intervenant: string | null
  theme: string | null; publie: boolean
}

function directFromRow(r: DirectRow): Direct {
  return {
    id: r.id, parishId: r.parish_id, titre: r.titre, description: r.description, url: r.url,
    debut: r.debut, fin: r.fin, statut: r.statut, intervenant: r.intervenant, theme: r.theme, publie: r.publie,
  }
}

function directToRow(d: Partial<DirectInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (d.titre !== undefined) row.titre = d.titre
  if (d.description !== undefined) row.description = d.description
  if (d.url !== undefined) row.url = d.url
  if (d.debut !== undefined) row.debut = d.debut
  if (d.fin !== undefined) row.fin = d.fin || null
  if (d.statut !== undefined) row.statut = d.statut
  if (d.intervenant !== undefined) row.intervenant = d.intervenant || null
  if (d.theme !== undefined) row.theme = d.theme || null
  if (d.publie !== undefined) row.publie = d.publie
  return row
}

/** Directs en cours et à venir (calendrier public). */
export async function getDirectsAVenir(): Promise<Direct[]> {
  const depuis = new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  const { data, error } = await filtrePublic(supabase.from('live_events').select('*').eq('publie', true).neq('statut', 'termine'))
    .gte('debut', depuis).order('debut').limit(20)
  if (error) throw error
  return (data ?? []).map(directFromRow)
}

export async function getAllDirects(): Promise<Direct[]> {
  const { data, error } = await filtreAdmin(supabase.from('live_events').select('*')).order('debut', { ascending: false })
  if (error) throw error
  return (data ?? []).map(directFromRow)
}

export async function createDirect(d: DirectInput): Promise<string> {
  const { data, error } = await supabase.from('live_events').insert({ ...directToRow(d), parish_id: parishIdPourCreation() }).select('id').single()
  if (error) throw error
  await logAudit('create', 'direct', data.id, d.titre)
  return data.id
}

export async function updateDirect(id: string, d: Partial<DirectInput>): Promise<void> {
  const { error } = await supabase.from('live_events').update({ ...directToRow(d), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  await logAudit('update', 'direct', id, d.titre)
}

export async function deleteDirect(id: string): Promise<void> {
  const { error } = await supabase.from('live_events').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'direct', id)
}

// ── Playlists ───────────────────────────────────────────────────────────────

export interface Playlist {
  id: string
  parishId: string | null
  titre: string
  slug: string
  description: string
  publicCible: PublicCible
  ordre: number
  publie: boolean
  evenementIds: string[]
}

export type PlaylistInput = Omit<Playlist, 'id' | 'parishId' | 'evenementIds'>

interface PlaylistRow {
  id: string; parish_id: string | null; titre: string; slug: string; description: string
  public_cible: PublicCible; ordre: number; publie: boolean
  playlist_items?: { evenement_id: string; ordre: number }[]
}

function playlistFromRow(r: PlaylistRow): Playlist {
  return {
    id: r.id, parishId: r.parish_id, titre: r.titre, slug: r.slug, description: r.description,
    publicCible: r.public_cible, ordre: r.ordre, publie: r.publie,
    evenementIds: [...(r.playlist_items ?? [])].sort((a, b) => a.ordre - b.ordre).map(i => i.evenement_id),
  }
}

export async function getPlaylistsPubliques(): Promise<Playlist[]> {
  const { data, error } = await filtrePublic(supabase.from('playlists').select('*, playlist_items(evenement_id, ordre)').eq('publie', true)).order('ordre')
  if (error) throw error
  return (data ?? []).map(playlistFromRow)
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const { data, error } = await filtreAdmin(supabase.from('playlists').select('*, playlist_items(evenement_id, ordre)')).order('ordre')
  if (error) throw error
  return (data ?? []).map(playlistFromRow)
}

export async function createPlaylist(d: PlaylistInput): Promise<string> {
  const { data, error } = await supabase.from('playlists').insert({
    parish_id: parishIdPourCreation(), titre: d.titre, slug: d.slug, description: d.description,
    public_cible: d.publicCible, ordre: d.ordre, publie: d.publie,
  }).select('id').single()
  if (error) throw error
  await logAudit('create', 'playlist', data.id, d.titre)
  return data.id
}

export async function updatePlaylist(id: string, d: Partial<PlaylistInput>): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (d.titre !== undefined) row.titre = d.titre
  if (d.slug !== undefined) row.slug = d.slug
  if (d.description !== undefined) row.description = d.description
  if (d.publicCible !== undefined) row.public_cible = d.publicCible
  if (d.ordre !== undefined) row.ordre = d.ordre
  if (d.publie !== undefined) row.publie = d.publie
  const { error } = await supabase.from('playlists').update(row).eq('id', id)
  if (error) throw error
  await logAudit('update', 'playlist', id, d.titre)
}

export async function deletePlaylist(id: string): Promise<void> {
  const { error } = await supabase.from('playlists').delete().eq('id', id)
  if (error) throw error
  await logAudit('delete', 'playlist', id)
}

/** Remplace le contenu d'une playlist par la liste ordonnée de vidéos. */
export async function setVideosPlaylist(playlistId: string, evenementIds: string[]): Promise<void> {
  const { error: delErr } = await supabase.from('playlist_items').delete().eq('playlist_id', playlistId)
  if (delErr) throw delErr
  if (evenementIds.length === 0) return
  const { error } = await supabase.from('playlist_items').insert(
    evenementIds.map((id, i) => ({ playlist_id: playlistId, evenement_id: id, ordre: i })),
  )
  if (error) throw error
  await logAudit('update', 'playlist', playlistId, `${evenementIds.length} vidéo(s)`)
}

