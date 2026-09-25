/**
 * Rendu markdown simplifié (titres, citations, listes, gras, italique).
 * Le texte est échappé avant la mise en forme : un contenu saisi dans
 * l'admin ne peut pas injecter de HTML.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 16, lineHeight: 1.85, color: 'var(--text)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 21, fontWeight: 700, color: 'var(--primary)', margin: '22px 0 8px' }}>{line.slice(3)}</h2>
        if (line.startsWith('### ')) return <h3 key={i} style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--blue)', margin: '16px 0 6px' }}>{line.slice(4)}</h3>
        if (line.startsWith('> ')) return <blockquote key={i} style={{ borderLeft: '3px solid var(--gold)', paddingLeft: 16, margin: '14px 0', fontStyle: 'italic', color: 'var(--text-mid)' }} dangerouslySetInnerHTML={{ __html: inline(line.slice(2)) }} />
        if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: 20, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: inline(line.slice(2)) }} />
        const num = /^(\d+)\. (.*)$/.exec(line)
        if (num) return <p key={i} style={{ marginLeft: 20, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: `<strong>${num[1]}.</strong> ${inline(num[2])}` }} />
        if (line.trim() === '') return <br key={i} />
        return <p key={i} style={{ marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: inline(line) }} />
      })}
    </div>
  )
}
