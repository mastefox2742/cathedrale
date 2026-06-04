import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const styles: Record<Variant, string> = {
  primary: 'bg-[var(--color-crimson)] text-white hover:bg-[var(--color-crimson-dark)] shadow-[var(--shadow-md)]',
  secondary: 'border-2 border-[var(--color-crimson)] text-[var(--color-crimson)] hover:bg-[var(--color-crimson)] hover:text-white',
  ghost: 'text-[var(--color-crimson)] hover:bg-[var(--color-ivory-dark)]',
  gold: 'bg-[var(--color-gold)] text-white hover:bg-[var(--color-earth)] shadow-[var(--shadow-gold)]',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-all duration-[var(--duration-base)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = 'Button'
