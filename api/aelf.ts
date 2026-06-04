// Vercel Edge Function — proxy AELF sans CORS
export const config = { runtime: 'edge' }

export default async function handler(request: Request) {
  const url = new URL(request.url)
  const date = url.searchParams.get('date') // format: 2026-06-04
  if (!date) return new Response('date requis', { status: 400 })

  const aelfUrl = `https://www.aelf.org/${date}/romain/messe`
  const res = await fetch(aelfUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
  })
  const html = await res.text()

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
