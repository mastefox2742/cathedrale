/** Prière : liturgie des heures (AELF) et chapelet du jour — partagés par les pages « Prier ». */

// ── Liturgie des heures (AELF) ──────────────────────────────────────────────

export const OFFICES = [
  { key: 'laudes', label: 'Laudes', moment: 'Prière du matin' },
  { key: 'sexte', label: 'Milieu du jour', moment: 'Vers midi' },
  { key: 'vepres', label: 'Vêpres', moment: 'Prière du soir' },
  { key: 'complies', label: 'Complies', moment: 'Avant le coucher' },
] as const

export type OfficeKey = typeof OFFICES[number]['key']

export interface PartieOffice { titre: string; html: string }

const BALISES_AUTORISEES = new Set(['P', 'BR', 'H4', 'H5', 'U', 'STRONG', 'EM', 'B', 'I', 'SPAN'])

/** Recopie le HTML d'AELF en ne gardant que des balises de mise en forme, sans attributs. */
function assainir(source: Element): string {
  const out = document.createElement('div')
  function copier(from: Node, to: Node) {
    from.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) { to.appendChild(document.createTextNode(n.textContent ?? '')); return }
      if (n.nodeType !== Node.ELEMENT_NODE) return
      const el = n as Element
      if (BALISES_AUTORISEES.has(el.tagName)) {
        const copie = document.createElement(el.tagName === 'SPAN' ? 'sup' : el.tagName.toLowerCase())
        copier(el, copie)
        to.appendChild(copie)
      } else {
        copier(el, to)
      }
    })
  }
  copier(source, out)
  return out.innerHTML
}

export async function chargerOffice(office: OfficeKey): Promise<PartieOffice[]> {
  const date = new Date().toISOString().slice(0, 10)
  const url = `/api/aelf?date=${date}&office=${office}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
  return Array.from(doc.querySelectorAll('.lecture')).map(el => {
    const clone = el.cloneNode(true) as Element
    const titre = clone.querySelector('h4')?.textContent?.trim() ?? ''
    clone.querySelector('h4')?.remove()
    clone.querySelectorAll('.lecture_link').forEach(x => x.remove())
    return { titre, html: assainir(clone) }
  }).filter(p => p.html.trim().length > 0)
}

// ── Chapelet ────────────────────────────────────────────────────────────────

const MYSTERES = {
  joyeux: { nom: 'Mystères joyeux', liste: ["L'Annonciation", 'La Visitation', 'La Nativité', 'La Présentation de Jésus au Temple', 'Le Recouvrement de Jésus au Temple'] },
  lumineux: { nom: 'Mystères lumineux', liste: ['Le Baptême de Jésus', 'Les Noces de Cana', "L'Annonce du Royaume", 'La Transfiguration', "L'Institution de l'Eucharistie"] },
  douloureux: { nom: 'Mystères douloureux', liste: "L'Agonie au jardin des Oliviers|La Flagellation|Le Couronnement d'épines|Le Portement de la Croix|La Crucifixion".split('|') },
  glorieux: { nom: 'Mystères glorieux', liste: ['La Résurrection', "L'Ascension", 'La Pentecôte', "L'Assomption de la Vierge Marie", 'Le Couronnement de la Vierge Marie'] },
}

/** Répartition traditionnelle : lundi/samedi joyeux, mardi/vendredi douloureux, mercredi/dimanche glorieux, jeudi lumineux. */
export function mysteresDuJour(jour: number) {
  if (jour === 1 || jour === 6) return MYSTERES.joyeux
  if (jour === 2 || jour === 5) return MYSTERES.douloureux
  if (jour === 4) return MYSTERES.lumineux
  return MYSTERES.glorieux
}

export const ETAPES_CHAPELET = [
  'Signe de croix et Credo',
  'Un Notre Père, trois Je vous salue Marie, un Gloire au Père',
  'Pour chaque mystère : annoncer le mystère, un Notre Père, dix Je vous salue Marie, un Gloire au Père',
  'Terminer par le Salve Regina',
]

/** Office le plus adapté à l'heure qu'il est. */
export function officeDuMoment(heure = new Date().getHours()): OfficeKey {
  if (heure < 11) return 'laudes'
  if (heure < 16) return 'sexte'
  if (heure < 20) return 'vepres'
  return 'complies'
}
