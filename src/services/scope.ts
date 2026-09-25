/**
 * Paroisse « courante » — deux contextes distincts :
 *
 * - public : la paroisse choisie par le visiteur (sélecteur de l'en-tête).
 *   Les contenus affichés = ceux de cette paroisse + ceux de l'archidiocèse
 *   (parish_id null). Mémorisée dans le navigateur.
 * - admin : le périmètre dans lequel le staff travaille (une paroisse, ou
 *   « tout l'archidiocèse » pour l'administration diocésaine). Les créations
 *   sont rattachées à ce périmètre.
 *
 * Les services lisent ces valeurs directement : pas besoin de les passer en
 * paramètre dans chaque page. Les layouts remontent la page quand elles changent.
 */

const PUBLIC_KEY = 'paroisse-courante'
const ADMIN_KEY = 'paroisse-admin'

/** Périmètre admin « tout l'archidiocèse ». */
export const ARCHIDIOCESE = 'archidiocese'

type Listener = () => void
const listeners = new Set<Listener>()

function read(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function write(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch { /* stockage indisponible : la valeur reste en mémoire */ }
}

let publicParish: string | null = read(PUBLIC_KEY)
let adminScope: string | null = read(ADMIN_KEY)

export function subscribeScope(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

function emit() { listeners.forEach(fn => fn()) }

export function getParoissePublique(): string | null { return publicParish }

export function setParoissePublique(id: string | null) {
  publicParish = id
  write(PUBLIC_KEY, id)
  emit()
}

/** Paroisse (uuid) ou ARCHIDIOCESE. */
export function getPerimetreAdmin(): string | null { return adminScope }

export function setPerimetreAdmin(scope: string | null) {
  adminScope = scope
  write(ADMIN_KEY, scope)
  emit()
}

/** parish_id à enregistrer pour un contenu créé dans le périmètre admin courant. */
export function parishIdPourCreation(): string | null {
  return adminScope && adminScope !== ARCHIDIOCESE ? adminScope : null
}

// Typage volontairement lâche : les builders Supabase sont très génériques et
// un paramètre récursif fait exploser l'inférence de TypeScript.
interface Filtrable {
  or(filters: string): unknown
  eq(column: string, value: unknown): unknown
}

/** Contenus publics : paroisse choisie + contenus archidiocésains. */
export function filtrePublic<T>(query: T): T {
  return publicParish ? (query as unknown as Filtrable).or(`parish_id.is.null,parish_id.eq.${publicParish}`) as T : query
}

/** Listes d'administration : uniquement le périmètre courant (tout, si archidiocèse). */
export function filtreAdmin<T>(query: T): T {
  if (!adminScope || adminScope === ARCHIDIOCESE) return query
  return (query as unknown as Filtrable).eq('parish_id', adminScope) as T
}

/** Champ parish_id d'une soumission publique (sinon la base applique la paroisse par défaut). */
export function parishPublique(): { parish_id?: string } {
  return publicParish ? { parish_id: publicParish } : {}
}
