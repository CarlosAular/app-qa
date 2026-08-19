import {type ComponentProps, type ComponentRef, forwardRef} from "react"
import {View} from "react-native"

import {cva, type VariantProps} from "class-variance-authority"

import {cn} from "@/lib/utils"

export const flexVariants = cva("", {
  variants: {
    direction: {
      row: "flex-row",
      column: "flex-col",
    },
    justify: {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
    },
    items: {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    gap: {
      none: "gap-none",
      xs: "gap-xs",
      s: "gap-sm",
      m: "gap-md",
      l: "gap-lg",
      xl: "gap-xl",
      "2xl": "gap-2xl",
      "3xl": "gap-3xl",
      "4xl": "gap-4xl",
      "5xl": "gap-5xl",
      "6xl": "gap-6xl",
      "7xl": "gap-7xl",
    },
    expanded: {
      true: "flex-1",
    },
    center: {
      true: "items-center justify-center",
    },
    insetTop: {
      true: "pt-safe",
    },
    insetBottom: {
      true: "pb-safe",
    },
  },
  defaultVariants: {
    direction: "column",
    center: false,
    expanded: false,
    insetTop: false,
    insetBottom: false,
    gap: "none",
  },
})

export type FlexVariants = VariantProps<typeof flexVariants>

export type FlexProps = ComponentProps<typeof View> & FlexVariants

const FlexComp = forwardRef<ComponentRef<typeof View>, FlexProps>(
  (
    {
      direction,
      expanded,
      className,
      center,
      gap,
      justify,
      items,
      insetTop,
      insetBottom,
      ...props
    },
    ref
  ) => (
    <View
      className={cn(
        flexVariants({
          direction,
          expanded,
          center,
          gap,
          justify,
          items,
          insetTop,
          insetBottom,
        }),
        className
      )}
      {...props}
      ref={ref}
    />
  )
)

FlexComp.displayName = "Flex"

export const Flex = FlexComp
