import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none text-sm font-semibold rounded-xl transition-all duration-150 ease-spring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:     "bg-gradient-electric text-white shadow-btn hover:shadow-btn-hover hover:-translate-y-px hover:brightness-105 active:translate-y-0 active:shadow-btn",
        destructive: "bg-rose-500 text-white shadow-sm hover:bg-rose-600 hover:-translate-y-px active:translate-y-0",
        outline:     "border border-surface-3 bg-white text-ink shadow-card hover:border-teal hover:bg-teal/5 hover:text-teal hover:-translate-y-px hover:shadow-card-hover active:translate-y-0",
        secondary:   "bg-surface-2 text-ink shadow-sm hover:bg-surface-3 hover:-translate-y-px",
        ghost:       "text-ink/70 hover:bg-surface-2 hover:text-ink",
        link:        "text-teal underline-offset-4 hover:underline",
        dark:        "bg-white/[0.08] text-white/90 border border-white/10 hover:bg-white/[0.14] hover:text-white",
      },
      size: {
        default:   "h-11 px-6 py-2.5",
        sm:        "h-8 rounded-lg px-3.5 text-xs",
        lg:        "h-12 rounded-xl px-8 text-base",
        xl:        "h-14 rounded-2xl px-10 text-base font-bold",
        icon:      "h-10 w-10 rounded-xl p-0",
        "icon-sm": "h-8 w-8 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="w-4 h-4 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
