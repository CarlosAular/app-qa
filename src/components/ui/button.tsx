import {Platform, Pressable} from "react-native"

import {cva, type VariantProps} from "class-variance-authority"

import {TextClassContext} from "@/components/ui/text"
import {cn} from "@/lib/utils"

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center gap-2 rounded-lg",
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary active:bg-primary/90",
          Platform.select({web: "hover:bg-primary/90"})
        ),
        accent: cn(
          "bg-accent active:bg-accent/90",
          Platform.select({web: "hover:bg-accent/90"})
        ),
        destructive: cn(
          "bg-destructive active:bg-destructive/90",
          Platform.select({
            web: "hover:bg-destructive/90 focus-visible:ring-destructive/40",
          })
        ),
        outline: cn(
          "border-border bg-card active:bg-muted border",
          Platform.select({
            web: "hover:bg-muted",
          })
        ),
        secondary: cn(
          "bg-secondary active:bg-secondary/80",
          Platform.select({web: "hover:bg-secondary/80"})
        ),
        ghost: cn("active:bg-muted", Platform.select({web: "hover:bg-muted"})),
        link: "",
      },
      size: {
        default: cn(
          "h-11 px-4 py-2 sm:h-10",
          Platform.select({web: "has-[>svg]:px-3"})
        ),
        sm: cn(
          "h-10 gap-1.5 rounded-lg px-3 sm:h-9",
          Platform.select({web: "has-[>svg]:px-2.5"})
        ),
        lg: cn(
          "h-12 rounded-lg px-6 sm:h-11",
          Platform.select({web: "has-[>svg]:px-4"})
        ),
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const buttonTextVariants = cva(
  cn(
    "font-sans text-foreground text-sm font-medium",
    Platform.select({web: "pointer-events-none transition-colors"})
  ),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        accent: "text-accent-foreground",
        destructive: "text-destructive-foreground",
        outline: "text-foreground",
        secondary: "text-secondary-foreground",
        ghost: "text-foreground",
        link: cn(
          "text-primary group-active:underline",
          Platform.select({
            web: "underline-offset-4 hover:underline group-hover:underline",
          })
        ),
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>

function Button({className, variant, size, ...props}: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({variant, size})}>
      <Pressable
        className={cn(
          props.disabled && "opacity-50",
          buttonVariants({variant, size}),
          className
        )}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  )
}

export {Button, buttonTextVariants, buttonVariants}
export type {ButtonProps}
