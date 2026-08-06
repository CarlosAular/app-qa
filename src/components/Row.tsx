import React, {forwardRef, type ComponentRef} from "react"
import {type View} from "react-native"

import {Flex, type FlexProps} from "./Flex"

export type RowProps = Omit<FlexProps, "direction">

export const Row = forwardRef<ComponentRef<typeof View>, RowProps>(
  ({children, ...props}, ref) => (
    <Flex direction="row" {...props} ref={ref}>
      {children}
    </Flex>
  )
)

Row.displayName = "Row"
