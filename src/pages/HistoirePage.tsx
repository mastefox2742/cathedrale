const HISTOIRE = [
  { annee: '1887', titre: 'Fondation de la mission', texte: "Le père Hippolyte Carrié obtient une concession de cent hectares autour d'une colline pour y installer la Mission du Saint-Esprit, d'abord placée sous le nom de Saint-Hippolyte." },
  { annee: '1892', titre: 'Première pierre', texte: "Le père Prosper Augouard pose la première pierre de l'édifice. Entre 700 000 et 800 000 briques seront fabriquées, cuites et transportées en dix-huit mois pour sa construction." },
  { annee: '1894', titre: 'Consécration de la cathédrale', texte: "La cathédrale est consacrée. Elle reste aujourd'hui considérée comme la plus ancienne cathédrale d'Afrique centrale encore conservée." },
  { annee: '1898', titre: 'La mission prend le nom de Sacré-Cœur', texte: 'Le nom Saint-Hippolyte laisse place à celui de Sacré-Cœur.' },
  { annee: '1938', titre: 'Premiers prêtres noirs ordonnés', texte: "Ordination des tout premiers prêtres noirs du diocèse, Auguste Roch Nkounkou et Eugène Nkakou." },
  { annee: '1955', titre: 'Érection en archidiocèse', texte: 'Le vicariat apostolique de Brazzaville devient archidiocèse le 14 septembre.' },
  { annee: '1977', titre: 'Sépulture du Cardinal Émile Biayenda', texte: "Assassiné le 22 mars, le cardinal Émile Biayenda, premier cardinal congolais, est inhumé dans la cathédrale." },
  { annee: '1980', titre: 'Visite du pape Jean-Paul II', texte: 'Le pape Jean-Paul II se rend à la cathédrale, moment marquant de son histoire récente.' },
]

export function HistoirePage() {
  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Notre Identité</p>
          <h1>Notre <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>Histoire</em></h1>
        </div>
      </div>

      {/* ══ HISTOIRE DE LA CATHÉDRALE ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--surface)' }}>
        <div className="inner">
          <div className="reveal" style={{ maxWidth: 640, marginBottom: 48 }}>
            <span className="section-label">Depuis 1887</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,40px)', fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
              Histoire de la Cathédrale Sacré-Cœur
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8 }}>
              Fondée en pleine forêt équatoriale en 1887, la Cathédrale Sacré-Cœur reste aujourd'hui considérée
              comme la plus ancienne cathédrale d'Afrique centrale encore conservée — un patrimoine que la
              paroisse porte avec fierté, et qui donne tout son sens au mot « mémoire ».
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {HISTOIRE.map((h) => (
              <div key={h.annee} className="reveal" style={{
                display: 'grid', gridTemplateColumns: '100px 1fr', gap: 28,
                padding: '28px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 34, fontWeight: 700, color: 'var(--blue)', lineHeight: 1 }}>
                  {h.annee}
                </span>
                <div>
                  <h3 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{h.titre}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-light)', fontWeight: 300, lineHeight: 1.75, maxWidth: 620 }}>{h.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ VERSE ══ */}
      <div className="verse-band reveal">
        <blockquote>
          « Où laisserais-je ce peuple qui m'a été confié ? »
          <cite className="verse-ref">Cardinal Émile Biayenda, quelques jours avant son assassinat, mars 1977</cite>
        </blockquote>
      </div>

      {/* ══ LE CARDINAL ÉMILE BIAYENDA ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%)' }}>
        <div className="inner">
          <div className="reveal grid-2" style={{ alignItems: 'start', gap: 'clamp(28px,5vw,72px)' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100%', aspectRatio: '3/4', background: 'rgba(255,255,255,.08)',
                border: '1.5px dashed rgba(255,255,255,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 10, textAlign: 'center', padding: 24,
              }}>
                <span style={{ fontSize: 34 }}>🖼️</span>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', maxWidth: 220 }}>
                  Photo officielle à venir
                </p>
              </div>
            </div>
            <div>
              <span className="section-label" style={{ color: 'var(--accent-light)' }}>Notre Pasteur — 1927-1977</span>
              <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(26px,3vw,38px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                Le Cardinal Émile Biayenda
              </h2>
              <div style={{
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)',
                borderRadius: 'var(--r-md)', padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
                  Né en 1927 à Mpangala, dans la région du Pool, Émile Biayenda est baptisé en 1938. Formé au
                  petit séminaire de Mbamou puis au grand séminaire de Brazzaville, il est ordonné prêtre le
                  26 octobre 1958. Après des études de sciences sociales et de théologie à Lyon, il devient
                  archevêque de Brazzaville en 1971, puis préside la Conférence épiscopale du Congo.
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
                  Le 5 mars 1973, le pape Paul VI le crée cardinal : il devient le premier cardinal congolais
                  de l'histoire. Le 22 mars 1977, quelques jours après l'assassinat du président Marien
                  Ngouabi, il est enlevé à son domicile, situé juste à côté de la cathédrale, puis tué dans la
                  nuit par un groupe de militaires — il avait 50 ans. Sa dépouille repose à la Cathédrale
                  Sacré-Cœur de Brazzaville.
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
                  En 1995, à la demande du pape Jean-Paul II, sa cause de béatification est officiellement
                  ouverte : il reçoit le titre de Serviteur de Dieu. Le dossier, validé par la Congrégation
                  romaine compétente en 2015, continue d'être activement soutenu par l'Église et les
                  autorités congolaises.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
