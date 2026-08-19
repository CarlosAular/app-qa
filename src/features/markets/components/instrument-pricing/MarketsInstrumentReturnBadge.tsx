import {cva, type VariantProps} from "class-variance-authority"
import {Minus, TrendingDown, TrendingUp} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"
import {cn} from "@/lib/utils"

import {formatMarketsPercent} from "../../marketFormatters"

const marketsInstrumentReturnBadgeVariants = cva(
  "min-h-7 items-center gap-xs self-end rounded-full px-sm py-xs",
  {
    variants: {
      direction: {
        down: "border border-destructive/20 bg-destructive/10",
        flat: "border border-border bg-muted",
        up: "border border-success/20 bg-success/10",
      },
    },
    defaultVariants: {
      direction: "flat",
    },
  }
)

const marketsInstrumentReturnTextVariants = cva("text-xs font-semibold", {
  variants: {
    direction: {
      down: "text-loss",
      flat: "text-muted-foreground",
      up: "text-profit",
    },
  },
  defaultVariants: {
    direction: "flat",
  },
})

const marketsInstrumentReturnIconVariants = cva("size-3.5", {
  variants: {
    direction: {
      down: "text-loss",
      flat: "text-muted-foreground",
      up: "text-profit",
    },
  },
  defaultVariants: {
    direction: "flat",
  },
})

type MarketsInstrumentReturnBadgeProps = {
  value: number
} & VariantProps<typeof marketsInstrumentReturnBadgeVariants>

export const MarketsInstrumentReturnBadge = ({
  direction,
  value,
}: MarketsInstrumentReturnBadgeProps) => {
  const DirectionIcon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
        ? TrendingDown
        : Minus

  return (
    <Row className={marketsInstrumentReturnBadgeVariants({direction})}>
      <Icon
        accessibilityElementsHidden
        as={DirectionIcon}
        className={cn(marketsInstrumentReturnIconVariants({direction}))}
      />
      <Text
        selectable
        className={cn(marketsInstrumentReturnTextVariants({direction}))}
      >
        {formatMarketsPercent(value)}
      </Text>
    </Row>
  )
}
