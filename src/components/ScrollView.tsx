import {type ComponentRef, forwardRef} from "react"

import {cva, type VariantProps} from "class-variance-authority"
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller"

import {useDynamicScrollView} from "@/hooks/useDynamicScroll"
import {cn} from "@/lib/utils"

const scrollViewVariants = cva("", {
  variants: {
    expanded: {
      true: "flex-1",
    },
  },
  defaultVariants: {
    expanded: false,
  },
})

const scrollContentVariants = cva("", {
  variants: {
    insetTop: {
      true: "pt-safe",
    },
    insetBottom: {
      true: "pb-safe",
    },
  },
  defaultVariants: {
    insetTop: false,
    insetBottom: false,
  },
})

type ScrollViewVariants = VariantProps<typeof scrollViewVariants> &
  VariantProps<typeof scrollContentVariants>

export type ScrollViewProps = ScrollViewVariants &
  Omit<
    KeyboardAwareScrollViewProps,
    "scrollEventThrottle" | "onContentSizeChange" | "onLayout"
  >

export const ScrollView = forwardRef<
  ComponentRef<typeof KeyboardAwareScrollView>,
  ScrollViewProps
>(
  (
    {
      expanded,
      insetTop,
      insetBottom,
      className,
      contentContainerClassName,
      scrollEnabled,
      ...props
    },
    ref
  ) => {
    const {scrollEnabled: scrollEnabledDynamic, ...rest} =
      useDynamicScrollView()

    return (
      <KeyboardAwareScrollView
        ref={ref}
        className={cn(scrollViewVariants({expanded}), className)}
        contentContainerClassName={cn(
          scrollContentVariants({insetTop, insetBottom}),
          contentContainerClassName
        )}
        scrollEnabled={scrollEnabled ?? scrollEnabledDynamic}
        {...rest}
        {...props}
      />
    )
  }
)

ScrollView.displayName = "ScrollView"
