import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  gold?: boolean
}

export function Card({ children, gold = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-md)] overflow-hidden transition-shadow duration-[var(--duration-base)] hover:shadow-[var(--shadow-lg)]',
        gold ? 'border border-[var(--color-gold-pale)]' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-6 border-b border-[var(--color-gray-100)] ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>
}
