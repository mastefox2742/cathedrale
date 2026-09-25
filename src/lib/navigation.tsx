'use client'

/**
 * Petites aides de navigation construites sur next/navigation, pour garder
 * dans les pages une écriture simple (navigate('/x'), NavLink actif, paramètres
 * d'URL modifiables).
 */

import { useCallback, useEffect, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'

/** navigate('/chemin') · navigate('/chemin', { replace: true }) · navigate(-1) */
export function useNavigate() {
  const router = useRouter()
  return useCallback((to: string | number, opts?: { replace?: boolean }) => {
    if (typeof to === 'number') { router.back(); return }
    if (opts?.replace) router.replace(to)
    else router.push(to)
  }, [router])
}

/** Paramètres d'URL + fonction pour les remplacer (comme l'API React Router). */
export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string>, opts?: { replace?: boolean }) => void] {
  const params = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const set = useCallback((next: URLSearchParams | Record<string, string>, opts?: { replace?: boolean }) => {
    const qs = (next instanceof URLSearchParams ? next : new URLSearchParams(next)).toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    if (opts?.replace) router.replace(url, { scroll: false })
    else router.push(url, { scroll: false })
  }, [router, pathname])
  return [new URLSearchParams(params?.toString() ?? ''), set]
}

interface NavLinkProps {
  to: string
  end?: boolean
  children: ReactNode
  className?: string
  style?: CSSProperties | ((s: { isActive: boolean }) => CSSProperties)
  onClick?: MouseEventHandler<HTMLAnchorElement>
  onMouseEnter?: MouseEventHandler<HTMLAnchorElement>
  onMouseLeave?: MouseEventHandler<HTMLAnchorElement>
  title?: string
}

/** Lien qui sait s'il correspond à la page courante (menus). */
export function NavLink({ to, end, children, style, ...rest }: NavLinkProps) {
  const pathname = usePathname() ?? '/'
  const isActive = end || to === '/' ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
  const s = typeof style === 'function' ? style({ isActive }) : style
  return (
    <Link href={to} style={s} aria-current={isActive ? 'page' : undefined} {...rest}>
      {children}
    </Link>
  )
}

/** Redirection côté client (après une vérification de droits par exemple). */
export function Navigate({ to, replace = true }: { to: string; replace?: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (replace) router.replace(to)
    else router.push(to)
  }, [router, to, replace])
  return null
}
