const HISTOIRE = [
  { annee: '1887', titre: 'Fondation de la mission', texte: "Le père Hippolyte Carrié obtient une concession de cent hectares sur la Butte de l'Aiglon pour y installer la Mission du Saint-Esprit, d'abord placée sous le nom de Saint-Hippolyte." },
  { annee: '1892', titre: 'Première pierre', texte: "Le père Prosper Augouard pose la première pierre de l'édifice. Entre 700 000 et 800 000 briques seront fabriquées, cuites et mises en œuvre en dix-huit mois à peine — les matériaux trop coûteux à importer étant acheminés à dos d'homme sur plus de quatre cents kilomètres à travers la forêt équatoriale." },
  { annee: '1893', titre: 'Construction du palais épiscopal', texte: 'Le palais épiscopal voisin est construit, formant avec la cathédrale un ensemble architectural colonial aujourd’hui remarquablement préservé.' },
  { annee: '1894', titre: 'Consécration de la cathédrale', texte: "La cathédrale est consacrée. Le bâtiment initial mesure 37 mètres de long sur 12 de large, avec une nef et deux bas-côtés portés par des colonnes de bois en palissandre, et un clocher élevant une croix à vingt mètres de hauteur. Elle reste aujourd'hui la plus ancienne cathédrale d'Afrique centrale encore conservée." },
  { annee: '1898', titre: 'La mission prend le nom de Sacré-Cœur', texte: 'Le nom Saint-Hippolyte laisse place à celui de Sacré-Cœur.' },
  { annee: '1903-1904', titre: 'Deux tours et nouvelle façade', texte: 'Le père Augouard ajoute deux tours à l’édifice et modifie sa façade.' },
  { annee: '1913', titre: 'Agrandissement', texte: 'Un transept et des bâtiments annexes viennent agrandir la cathédrale.' },
  { annee: '1938', titre: 'Premiers prêtres noirs ordonnés', texte: "Ordination des tout premiers prêtres noirs du diocèse, Auguste Roch Nkounkou et Eugène Nkakou." },
  { annee: '1944', titre: 'Visite du général de Gaulle', texte: 'Le général de Gaulle se rend à la cathédrale, moment marquant de son histoire.' },
  { annee: '1952', titre: 'Le clocher remanié', texte: "Le clocher est remanié par l'architecte Roger Erell." },
  { annee: '1955', titre: 'Érection en archidiocèse', texte: 'Le vicariat apostolique de Brazzaville devient archidiocèse le 14 septembre.' },
  { annee: '1972', titre: 'Requiem du président Fulbert Youlou', texte: 'La cathédrale accueille la messe de requiem du président Fulbert Youlou.' },
  { annee: '1977', titre: 'Sépulture du Cardinal Émile Biayenda', texte: "Assassiné le 22 mars, le cardinal Émile Biayenda, premier cardinal congolais, est inhumé dans la cathédrale." },
  { annee: '1980', titre: 'Visite du pape Jean-Paul II', texte: 'Le pape Jean-Paul II se rend à la cathédrale, moment marquant de son histoire récente.' },
  { annee: '1982', titre: 'Requiem de Monseigneur Nkounkou', texte: 'La cathédrale accueille la messe de requiem de Monseigneur Nkounkou.' },
  { annee: '1993', titre: 'Dernier grand remaniement', texte: "Un dernier remaniement d'ampleur est réalisé sur l'édifice." },
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
              Sur la colline de la Butte de l'Aiglon, à quinze cents mètres du fleuve Congo, se dresse depuis
              plus d'un siècle la plus ancienne cathédrale d'Afrique centrale encore conservée. Sa construction
              reste un exploit dont peu de visiteurs mesurent aujourd'hui l'ampleur : entre 700 000 et 800 000
              briques ont été fabriquées, cuites, transportées et mises en œuvre en dix-huit mois à peine, les
              matériaux importés de métropole étant acheminés à dos d'homme sur plus de quatre cents kilomètres
              à travers la forêt équatoriale. Un patrimoine que la paroisse porte avec fierté, et qui donne
              tout son sens au mot « mémoire ».
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {HISTOIRE.map((h) => (
              <div key={h.annee} className="reveal" style={{
                display: 'grid', gridTemplateColumns: '100px 1fr', gap: 28,
                padding: '28px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--blue)', lineHeight: 1.1 }}>
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

      {/* ══ GALERIE HISTORIQUE ══ */}
      <section style={{ padding: 'var(--space-xl) 0', background: 'var(--bg)' }}>
        <div className="inner">
          <div className="reveal" style={{ maxWidth: 640, marginBottom: 32 }}>
            <span className="section-label">Archives</span>
            <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 'clamp(22px,2.6vw,32px)', fontWeight: 700, color: 'var(--text)' }}>
              Galerie historique
            </h2>
          </div>
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            <figure style={{ margin: 0 }}>
              <img
                src="/cathedrale-construction-1892.jpg"
                alt="Construction de la première cathédrale de Brazzaville, 1892"
                style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', borderRadius: 'var(--r-md)' }}
              />
              <figcaption style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 10, lineHeight: 1.6 }}>
                Construction de la première cathédrale de Brazzaville (1892)
              </figcaption>
            </figure>
            <figure style={{ margin: 0 }}>
              <img
                src="/cathedrale-carte-postale-1900.jpg"
                alt="Carte postale ancienne de la Cathédrale de Brazzaville"
                style={{ width: '100%', aspectRatio: '3/2', objectFit: 'cover', borderRadius: 'var(--r-md)' }}
              />
              <figcaption style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 10, lineHeight: 1.6 }}>
                Carte postale ancienne, Congo — Cathédrale de Brazzaville
              </figcaption>
            </figure>
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
              <img
                src="/cardinal-biayenda.webp"
                alt="Portrait du Cardinal Émile Biayenda"
                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--r-md)', boxShadow: '0 20px 50px rgba(0,0,0,.35)' }}
              />
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
                  L'histoire de la cathédrale est inséparable de celle du cardinal Émile Biayenda, dont la
                  dépouille y repose depuis 1977. Premier cardinal congolais, il demeure une référence
                  spirituelle majeure pour toute l'Église du Congo — et un exemple particulièrement parlant
                  pour la jeunesse d'aujourd'hui.
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
                  Né en 1927 à Mpangala, dans la région du Pool, Émile Biayenda est baptisé en 1938. Il rejoint
                  le petit séminaire Saint-Paul de Mbamou, où il se distingue entre 1944 et 1950, avant de
                  poursuivre sa formation au grand séminaire de Brazzaville jusqu'en 1958. Il est ordonné
                  prêtre le 26 octobre 1958, pour le diocèse de Brazzaville.
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
                  Entre 1966 et 1969, il complète sa formation à l'Université catholique de Lyon, en sciences
                  sociales et en théologie. Nommé archevêque coadjuteur de Brazzaville le 7 mars 1970, il est
                  consacré évêque à Rome le 17 mai de la même année, puis devient archevêque de Brazzaville en
                  titre le 14 juin 1971, avant de présider la Conférence épiscopale du Congo. Le 5 mars 1973,
                  le pape Paul VI le crée cardinal : il devient ainsi le premier cardinal congolais de
                  l'histoire.
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
                  Son engagement lui coûtera la vie. Après l'assassinat du président Marien Ngouabi le 18 mars
                  1977, le cardinal Biayenda est enlevé à son domicile, situé juste à côté de la cathédrale,
                  dans l'après-midi du 22 mars 1977, puis tué dans la nuit par un groupe de militaires, à
                  l'âge de cinquante ans — les motifs exacts de son assassinat n'ayant jamais été pleinement
                  établis. Averti du danger et invité à fuir, il serait resté fidèle à son
                  peuple jusqu'au bout. Sa dépouille repose à la Cathédrale Sacré-Cœur de Brazzaville.
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
                  En 1995, à la demande du pape Jean-Paul II, sa cause de béatification est officiellement
                  ouverte : il reçoit le titre de Serviteur de Dieu. L'enquête diocésaine s'est déroulée de
                  1996 à 2003, et la commission historique a achevé ses travaux en 2014 ; le dossier a été
                  validé par la Congrégation romaine compétente le 29 mai 2015. La cause continue d'être
                  activement soutenue par l'Église et les autorités congolaises, en vue d'une reconnaissance
                  de ses vertus héroïques — première étape avant une éventuelle béatification.
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
                  Informer, former, accompagner, rassembler : la vie du cardinal Biayenda est une illustration
                  vivante de la mission que cette plateforme veut servir, et une source d'inspiration naturelle
                  pour les parcours proposés aux jeunes de la cathédrale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
