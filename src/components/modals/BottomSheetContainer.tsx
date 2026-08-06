import {type PropsWithChildren} from "react"

import {BottomSheetView} from "@gorhom/bottom-sheet"
import {type BottomSheetViewProps} from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetView/types"
import {cva, type VariantProps} from "class-variance-authority"

import {cn} from "@/lib/utils"

const bottomSheetContainer = cva("px-street", {
  variants: {
    expanded: {
      true: "flex-1",
    },
    insetBottom: {
      true: "pb-safe",
    },
  },
  defaultVariants: {
    expanded: false,
    insetBottom: false,
  },
})

type BottomSheetContainerVariants = VariantProps<typeof bottomSheetContainer>

type Props = PropsWithChildren &
  BottomSheetViewProps &
  BottomSheetContainerVariants

export const BottomSheetContainer = ({
  children,
  expanded,
  insetBottom,
  className,
  ...props
}: Props) => {
  return (
    <BottomSheetView
      className={cn(bottomSheetContainer({expanded, insetBottom}), className)}
      {...props}
    >
      {children}
    </BottomSheetView>
  )
}
