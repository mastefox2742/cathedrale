import { colors } from './colors'

/**
 * Jetons de la maquette « Archidiocèse — Médiation & Évangélisation »
 * (export HTML). Même palette que l'application ; titres en Inter
 * (--font-heading: "Inter"), rayon de base 0.75rem (12 px).
 */
export const d = {
  ...colors,
  navy: '#0B2942',      // dégradés et encart « Direct TV »
  ink: '#071724',       // fond de l'écran Archidiocèse TV
  white: '#FFFFFF',
  /** Couleur avec opacité (équivalent des classes Tailwind « bg-accent/15 »). */
  alpha(hex: string, a: number): string {
    const n = parseInt(hex.slice(1), 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
  },
} as const

/** Tailwind : rounded-lg = 12, rounded-xl = 16, rounded-2xl = 20 (radius 0.75rem). */
export const r = { md: 10, lg: 12, xl: 16, '2xl': 20, full: 999 } as const

export const f = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  mono: 'Inter_500Medium',
} as const

/** Ombre « shadow-xs » / « shadow-sm » de Tailwind. */
export const ombre = {
  xs: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  sm: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
} as const

/** Équivalent de « absolute inset-0 ». */
export const plein = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const
