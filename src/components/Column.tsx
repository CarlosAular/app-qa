import React, {forwardRef, type ComponentRef} from "react"
import {type View} from "react-native"

import {Flex, type FlexProps} from "./Flex"

export type ColumnProps = Omit<FlexProps, "direction">

export const Column = forwardRef<ComponentRef<typeof View>, ColumnProps>(
  ({children, ...props}, ref) => (
    <Flex direction="column" {...props} ref={ref}>
      {children}
    </Flex>
  )
)

Column.displayName = "Column"
