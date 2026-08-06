import {type ComponentProps, type ComponentRef, forwardRef} from "react"
import {View} from "react-native"

import {cva, type VariantProps} from "class-variance-authority"

import {cn} from "@/lib/utils"

const containerVariants = cva("bg-background px-street", {
  variants: {
    expanded: {
      true: "flex-1",
    },
    insetTop: {
      true: "pt-safe",
    },
    insetBottom: {
      true: "pb-safe",
    },
  },
  defaultVariants: {
    expanded: false,
  },
})

export type ContainerVariants = VariantProps<typeof containerVariants>

export type ContainerProps = ComponentProps<typeof View> & ContainerVariants

export const Container = forwardRef<ComponentRef<typeof View>, ContainerProps>(
  ({expanded, insetTop, insetBottom, className, ...props}, ref) => {
    return (
      <View
        className={cn(
          containerVariants({expanded, insetTop, insetBottom}),
          className
        )}
        {...props}
        ref={ref}
      />
    )
  }
)

Container.displayName = "Container"
