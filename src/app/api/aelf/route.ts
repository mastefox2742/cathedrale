/**
 * Proxy AELF (textes liturgiques officiels) — contourne le CORS du site AELF.
 * GET /api/aelf?date=AAAA-MM-JJ&office=messe|lectures|laudes|tierce|sexte|none|vepres|complies
 */

// Liste fermée : le paramètre n'est jamais injecté tel quel dans l'URL.
const OFFICES = ['messe', 'lectures', 'laudes', 'tierce', 'sexte', 'none', 'vepres', 'complies']

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response('date invalide (format attendu : AAAA-MM-JJ)', { status: 400 })
  }
  const office = searchParams.get('office') ?? 'messe'
  if (!OFFICES.includes(office)) {
    return new Response('office invalide', { status: 400 })
  }

  const res = await fetch(`https://www.aelf.org/${date}/romain/${office}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) return new Response('AELF indisponible', { status: 502 })

  return new Response(await res.text(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
