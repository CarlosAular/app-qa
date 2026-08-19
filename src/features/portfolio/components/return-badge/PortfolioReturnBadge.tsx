import {View} from "react-native"

import {cva, type VariantProps} from "class-variance-authority"
import {Minus, TrendingDown, TrendingUp} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"
import {cn} from "@/lib/utils"

import {
  formatPortfolioPercent,
  formatPortfolioSignedPeso,
} from "../../portfolioFormatters"
import type {PortfolioPositionDirection} from "../../types"

const portfolioReturnBadgeVariants = cva("rounded-lg border", {
  variants: {
    direction: {
      down: "border-destructive/25 bg-destructive/15",
      flat: "border-border bg-muted/40",
      up: "border-success/25 bg-success/15",
    },
    layout: {
      badge: "min-w-[112px] px-sm py-xs items-end gap-xs",
      banner: "px-md py-sm w-full flex-row items-center justify-between",
    },
  },
  defaultVariants: {
    direction: "flat",
    layout: "badge",
  },
})

const portfolioReturnTextVariants = cva("font-semibold tabular-nums", {
  variants: {
    direction: {
      down: "text-loss",
      flat: "text-muted-foreground",
      up: "text-profit",
    },
    size: {
      gain: "text-sm leading-5",
      gainBanner: "text-base leading-6",
      ratio: "text-xs leading-4",
      ratioBanner: "text-sm leading-5",
    },
  },
  defaultVariants: {
    direction: "flat",
    size: "gain",
  },
})

const portfolioReturnIconVariants = cva("", {
  variants: {
    direction: {
      down: "text-loss",
      flat: "text-muted-foreground",
      up: "text-profit",
    },
    layout: {
      badge: "size-3.5",
      banner: "size-4",
    },
  },
  defaultVariants: {
    direction: "flat",
    layout: "badge",
  },
})

type PortfolioReturnBadgeProps = {
  direction: PortfolioPositionDirection
  gain: number
  layout?: "badge" | "banner"
  returnRatio: number
} & VariantProps<typeof portfolioReturnBadgeVariants>

export const PortfolioReturnBadge = ({
  direction,
  gain,
  layout = "badge",
  returnRatio,
}: PortfolioReturnBadgeProps) => {
  const DirectionIcon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
        ? TrendingDown
        : Minus

  if (layout === "banner") {
    return (
      <View className={portfolioReturnBadgeVariants({direction, layout})}>
        <Row className="gap-sm items-center">
          <Icon
            accessibilityElementsHidden
            as={DirectionIcon}
            className={cn(portfolioReturnIconVariants({direction, layout}))}
          />
          <Text
            selectable
            className={cn(
              portfolioReturnTextVariants({direction, size: "gainBanner"})
            )}
            style={{fontVariant: ["tabular-nums"]}}
          >
            {formatPortfolioSignedPeso(gain)}
          </Text>
        </Row>
        <Text
          selectable
          className={cn(
            portfolioReturnTextVariants({direction, size: "ratioBanner"})
          )}
          style={{fontVariant: ["tabular-nums"]}}
        >
          {formatPortfolioPercent(returnRatio)}
        </Text>
      </View>
    )
  }

  return (
    <View className={portfolioReturnBadgeVariants({direction, layout})}>
      <Row className="gap-xs items-center">
        <Icon
          accessibilityElementsHidden
          as={DirectionIcon}
          className={cn(portfolioReturnIconVariants({direction, layout}))}
        />
        <Text
          selectable
          className={cn(portfolioReturnTextVariants({direction, size: "gain"}))}
          style={{fontVariant: ["tabular-nums"]}}
        >
          {formatPortfolioSignedPeso(gain)}
        </Text>
      </Row>
      <Text
        selectable
        className={cn(portfolioReturnTextVariants({direction, size: "ratio"}))}
        style={{fontVariant: ["tabular-nums"]}}
      >
        {formatPortfolioPercent(returnRatio)}
      </Text>
    </View>
  )
}
