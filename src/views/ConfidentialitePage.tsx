import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Politique de confidentialité (RGPD et législation congolaise sur les données
 * personnelles). Texte de travail : à relire et adopter par l'archevêché.
 */

const DUREES: [string, string][] = [
  ['Compte (nom, email, téléphone, paroisse)', "Jusqu'à la suppression du compte par la personne, ou 3 ans sans connexion"],
  ['Démarches pastorales (baptême, mariage…)', '3 ans après le traitement de la demande, sauf inscription aux registres paroissiaux'],
  ['Intentions de prière', '1 an'],
  ['Dons', '10 ans (obligations comptables)'],
  ['Suivi de catéchèse des enfants, consentements parentaux', "Durée de l'inscription, puis 1 an"],
  ['Signalements (protection des mineurs)', 'Durée de la procédure, puis archivage restreint selon la charte de protection des mineurs'],
  ['Jetons de notification', "Jusqu'à la désactivation des notifications ou 6 mois d'inactivité"],
  ['Journaux techniques (sécurité)', '30 jours, sans données personnelles identifiantes'],
]

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: 'var(--v2-font-serif)', fontSize: 22, color: 'var(--primary)', marginBottom: 10 }}>{titre}</h2>
      <div style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </section>
  )
}

export function ConfidentialitePage() {
  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <p className="page-hero-eyebrow">Vos données</p>
          <h1>Politique de <em style={{ color: 'var(--accent-light)', fontStyle: 'italic' }}>confidentialité</em></h1>
        </div>
      </div>

      <div className="inner" style={{ maxWidth: 820, padding: 'var(--space-xl) var(--pad-x)' }}>
        <p style={{ fontSize: 12, color: 'var(--accent-dark)', fontWeight: 700, marginBottom: 28 }}>
          Document de travail — à relire et adopter par l'archevêché avant publication officielle.
        </p>

        <Section titre="Qui est responsable de vos données ?">
          <p>L'Archidiocèse de Brazzaville (Archevêché, avenue de la Paix, Brazzaville, République du Congo) est responsable des données collectées sur ce site et dans l'application mobile. Chaque paroisse n'accède qu'aux données qui la concernent.</p>
        </Section>

        <Section titre="Quelles données, et pourquoi ?">
          <p>Nous collectons uniquement ce qui est nécessaire à la vie pastorale :</p>
          <ul style={{ paddingLeft: 20 }}>
            <li><strong>Compte</strong> : nom, email, téléphone (facultatif), paroisse — pour vous connecter et vous rattacher à votre paroisse.</li>
            <li><strong>Démarches</strong> (baptême, mariage, obsèques…) : les informations du formulaire — pour que la paroisse traite votre demande.</li>
            <li><strong>Intentions de prière, témoignages</strong> : le texte que vous confiez, publié seulement si vous l'acceptez et après relecture.</li>
            <li><strong>Dons</strong> : montant, moyen de paiement, référence — pour la comptabilité et votre reçu.</li>
            <li><strong>Catéchèse des enfants</strong> : prénom, nom, présences, progression, consentements parentaux — pour l'accompagnement, visibles par les parents et l'équipe de catéchèse.</li>
            <li><strong>Signalements</strong> : ce que vous choisissez d'indiquer, anonymement si vous le souhaitez — traités par le seul responsable de la protection des mineurs.</li>
          </ul>
          <p>Nous ne vendons ni ne cédons aucune donnée, et n'utilisons aucun cookie publicitaire ou de mesure d'audience.</p>
        </Section>

        <Section titre="Cookies">
          <p>Le site n'utilise que des cookies strictement nécessaires : maintien de votre connexion et sécurité (vérification anti-robot). Ils ne nécessitent pas de consentement et ne servent à aucun suivi.</p>
        </Section>

        <Section titre="Combien de temps ?">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {DUREES.map(([d, t]) => (
                  <tr key={d} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px 10px 0', fontWeight: 600, color: 'var(--text)', verticalAlign: 'top' }}>{d}</td>
                    <td style={{ padding: '10px 0' }}>{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section titre="Qui y a accès ?">
          <p>Les équipes paroissiales et diocésaines, chacune limitée à son rôle (par exemple, un catéchiste ne voit que les enfants de sa paroisse). Les comptes d'administration sont protégés par une double authentification.</p>
          <p>Prestataires techniques, qui n'utilisent pas vos données pour leur propre compte : Supabase (hébergement de la base de données, chiffrée), Vercel (hébergement du site), Google Firebase (envoi des notifications, si vous les activez), Cloudflare (vérification anti-robot).</p>
        </Section>

        <Section titre="Vos droits">
          <p>Vous pouvez à tout moment consulter, corriger, exporter ou supprimer vos données : depuis votre <Link href="/connexion" style={{ color: 'var(--blue)' }}>Espace membre</Link> (rubrique « Mes données » : export au format JSON et suppression du compte), ou en écrivant au secrétariat de votre paroisse.</p>
          <p>Vous pouvez aussi retirer un consentement (notifications, publication d'un témoignage, image d'un enfant) et vous opposer à un traitement. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l'autorité de protection des données compétente.</p>
        </Section>

        <Section titre="Sécurité">
          <p>Connexions chiffrées (HTTPS), accès limités par rôle et par paroisse dans la base de données, double authentification pour l'administration, protection contre les robots et les tentatives répétées. En cas d'incident touchant vos données, vous serez informé dans les meilleurs délais (72 heures au plus pour l'autorité compétente).</p>
        </Section>
      </div>
    </>
  )
}
