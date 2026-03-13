import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-slate-200 bg-slate-100 text-slate-700',
        success: 'border-success-500/20 bg-success-50 text-success-600',
        warning: 'border-warning-500/20 bg-warning-50 text-warning-600',
        danger: 'border-danger-500/20 bg-danger-50 text-danger-600',
        info: 'border-primary-200 bg-primary-50 text-primary-600',
        pro: 'border-primary-500/30 bg-primary-500 text-white',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px] tracking-wide',
        md: 'px-2.5 py-0.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export { badgeVariants }
export type { VariantProps }
