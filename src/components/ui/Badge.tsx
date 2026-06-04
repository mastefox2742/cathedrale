import { ReactNode } from 'react'

type BadgeVariant = 'liturgy' | 'event' | 'formation' | 'prayer'

const variants: Record<BadgeVariant, string> = {
  liturgy: 'bg-[var(--color-crimson)] text-white',
  event: 'bg-[var(--color-gold-pale)] text-[var(--color-earth)]',
  formation: 'bg-[var(--color-sky)] text-white',
  prayer: 'bg-[var(--color-ivory-dark)] text-[var(--color-crimson)]',
}

export function Badge({ children, variant = 'liturgy' }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${variants[variant]}`}>
      {children}
    </span>
  )
}
