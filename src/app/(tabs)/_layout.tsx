import {NativeTabs} from "expo-router/unstable-native-tabs"

const tradingTabColors = {
  background: "#07111f",
  defaultIcon: "#64748b",
  defaultLabel: "#9aa7bd",
  indicator: "#2dd4bf26",
  ripple: "#2dd4bf33",
  selected: "#2dd4bf",
  shadow: "#020617",
} as const

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={tradingTabColors.background}
      blurEffect="systemChromeMaterialDark"
      disableTransparentOnScrollEdge
      iconColor={{
        default: tradingTabColors.defaultIcon,
        selected: tradingTabColors.selected,
      }}
      indicatorColor={tradingTabColors.indicator}
      labelStyle={{
        default: {color: tradingTabColors.defaultLabel, fontSize: 12},
        selected: {
          color: tradingTabColors.selected,
          fontSize: 12,
          fontWeight: "700",
        },
      }}
      labelVisibilityMode="labeled"
      minimizeBehavior="onScrollDown"
      rippleColor={tradingTabColors.ripple}
      shadowColor={tradingTabColors.shadow}
      tintColor={tradingTabColors.selected}
    >
      <NativeTabs.Trigger disableAutomaticContentInsets name="markets">
        <NativeTabs.Trigger.Icon
          md="trending_up"
          sf={{
            default: "chart.line.uptrend.xyaxis",
            selected: "chart.line.uptrend.xyaxis",
          }}
        />
        <NativeTabs.Trigger.Label>Mercados</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger disableAutomaticContentInsets name="portfolio">
        <NativeTabs.Trigger.Icon
          md="account_balance_wallet"
          sf={{default: "briefcase", selected: "briefcase.fill"}}
        />
        <NativeTabs.Trigger.Label>Portafolio</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger disableAutomaticContentInsets name="orders">
        <NativeTabs.Trigger.Icon
          md="receipt_long"
          sf={{
            default: "list.bullet.rectangle",
            selected: "list.bullet.rectangle.fill",
          }}
        />
        <NativeTabs.Trigger.Label>Órdenes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        disableAutomaticContentInsets
        name="search"
        role="search"
      >
        <NativeTabs.Trigger.Icon
          md="search"
          sf={{default: "magnifyingglass", selected: "magnifyingglass"}}
        />
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
