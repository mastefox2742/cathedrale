'use client'

import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from '../../lib/navigation'
import {
  logout, ROLE_LABELS, canManageEnfants, canViewSignalements, canManageDons, canManageMembres,
  canViewAudit, canViewRegistre, type Role,
} from '../../services/auth'
import { useAuth, useDroits } from '../../contexts/AuthContext'
import { getToutesParoisses, type Paroisse } from '../../services/paroisses'
import { setPerimetreAdmin, ARCHIDIOCESE } from '../../services/scope'

interface NavItem { to: string; icon: string; label: string; exact?: boolean; visible?: (roles: Role[], d: ReturnType<typeof useDroits>) => boolean }

const SECTIONS: { titre: string; items: NavItem[] }[] = [
  {
    titre: 'Pilotage',
    items: [
      { to: '/admin', icon: 'dashboard', label: 'Tableau de bord', exact: true },
      { to: '/admin/paroisses', icon: 'church', label: 'Paroisses', visible: (r, d) => d.isDiocesanAdmin || canManageMembres(r) },
      { to: '/admin/notifications', icon: 'notifications', label: 'Notifications' },
    ],
  },
  {
    titre: 'Médiation & contenus',
    items: [
      { to: '/admin/tv', icon: 'smart_display', label: 'Médiation / TV' },
      { to: '/admin/evenements', icon: 'live_tv', label: 'Vidéos & Replays' },
      { to: '/admin/annonces', icon: 'campaign', label: 'Annonces' },
      { to: '/admin/homelies', icon: 'record_voice_over', label: 'Homélies' },
      { to: '/admin/medias', icon: 'perm_media', label: 'Médiathèque' },
      { to: '/admin/temoignages', icon: 'rate_review', label: 'Témoignages' },
    ],
  },
  {
    titre: 'Évangélisation & catéchèse',
    items: [
      { to: '/admin/parcours', icon: 'route', label: 'Parcours de foi' },
      { to: '/admin/catechisme', icon: 'school', label: 'Catéchisme' },
      { to: '/admin/formations', icon: 'menu_book', label: 'Formations' },
      { to: '/admin/catechiste', icon: 'edit_calendar', label: 'Espace catéchiste' },
      { to: '/admin/registre', icon: 'verified_user', label: 'Registre du staff', visible: r => canViewRegistre(r) },
    ],
  },
  {
    titre: 'Vie paroissiale',
    items: [
      { to: '/admin/groupes', icon: 'groups', label: 'Groupes & adhésions' },
      { to: '/admin/demarches', icon: 'assignment', label: 'Démarches pastorales' },
      { to: '/admin/intentions', icon: 'volunteer_activism', label: 'Intentions de prière' },
      { to: '/admin/services-paroissiaux', icon: 'apartment', label: 'Services paroissiaux' },
      { to: '/admin/abonnes', icon: 'mark_email_read', label: 'Abonnés' },
    ],
  },
  {
    titre: 'Dons',
    items: [
      { to: '/admin/dons', icon: 'payments', label: 'Dons reçus', visible: r => canManageDons(r) },
      { to: '/admin/projets-dons', icon: 'paid', label: 'Projets de dons', visible: r => canManageDons(r) },
    ],
  },
  {
    titre: 'Sécurité',
    items: [
      { to: '/admin/parent-enfant', icon: 'family_restroom', label: 'Suivi Parent-Enfant', visible: r => canManageEnfants(r) },
      { to: '/admin/signalements', icon: 'shield', label: 'Signalements', visible: r => canViewSignalements(r) },
      { to: '/admin/utilisateurs', icon: 'manage_accounts', label: 'Utilisateurs & Rôles', visible: (_r, d) => d.isDiocesanAdmin },
      { to: '/admin/audit', icon: 'history', label: "Journaux d'audit", visible: r => canViewAudit(r) },
    ],
  },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, appartenances } = useAuth()
  const droits = useDroits()
  const navigate = useNavigate()
  const [paroisses, setParoisses] = useState<Paroisse[]>([])

  const choix = droits.isDiocesanAdmin ? paroisses : paroisses.filter(p => droits.paroissesStaff.includes(p.id))

  useEffect(() => {
    getToutesParoisses().then(setParoisses).catch(() => setParoisses([]))
  }, [])

  // Périmètre par défaut / invalide : première paroisse autorisée, ou l'archidiocèse.
  useEffect(() => {
    if (paroisses.length === 0) return
    const p = droits.perimetre
    const valide = (p === ARCHIDIOCESE && droits.peutArchidiocese) || (!!p && choix.some(c => c.id === p))
    if (valide) return
    const defaut = droits.peutArchidiocese && choix.length !== 1 ? ARCHIDIOCESE : (choix[0]?.id ?? null)
    if (defaut !== p) setPerimetreAdmin(defaut)
  }, [paroisses, droits.perimetre, droits.peutArchidiocese, choix])

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  const rolesAffiches = [
    ...(profile?.role ? [ROLE_LABELS[profile.role]] : []),
    ...appartenances.filter(a => a.parishId === droits.perimetre && a.role !== 'membre').map(a => ROLE_LABELS[a.role]),
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa', fontFamily: 'var(--font-sans)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--primary)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                objectFit: 'cover', flexShrink: 0,
                border: '2px solid rgba(254,214,91,0.5)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            />
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>Archidiocèse</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Administration</p>
            </div>
          </div>
        </div>

        {/* Périmètre de travail */}
        <div style={{ padding: '14px 12px 4px' }}>
          <label htmlFor="perimetre-admin" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 6, paddingLeft: 4 }}>
            Périmètre
          </label>
          <select
            id="perimetre-admin"
            value={droits.perimetre ?? ''}
            onChange={e => setPerimetreAdmin(e.target.value || null)}
            style={{
              width: '100%', padding: '9px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer',
            }}
          >
            {droits.peutArchidiocese && <option value={ARCHIDIOCESE} style={{ color: '#222' }}>Tout l'archidiocèse</option>}
            {choix.map(p => <option key={p.id} value={p.id} style={{ color: '#222' }}>{p.nom}{p.actif ? '' : ' (inactive)'}</option>)}
          </select>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px 16px' }}>
          {SECTIONS.map(section => {
            const items = section.items.filter(i => !i.visible || i.visible(droits.roles, droits))
            if (items.length === 0) return null
            return (
              <div key={section.titre} style={{ marginTop: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', padding: '0 12px', marginBottom: 6 }}>
                  {section.titre}
                </p>
                {items.map(({ to, icon, label, exact }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                      textDecoration: 'none', fontSize: 14, fontWeight: 500,
                      background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                      borderLeft: isActive ? '3px solid var(--secondary-container)' : '3px solid transparent',
                      transition: 'all 0.15s',
                    })}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    {label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* Profil + déconnexion */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {profile && (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>{profile.nom || profile.email}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{rolesAffiches.join(' · ') || 'Staff'}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(198,40,40,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Contenu principal (remonté à chaque changement de périmètre) ── */}
      <main key={droits.perimetre ?? 'aucun'} style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
