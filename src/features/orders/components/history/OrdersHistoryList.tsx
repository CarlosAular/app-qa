import {View} from "react-native"

import {FlashList} from "@shopify/flash-list"
import {ReceiptText} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

import {OrdersHistoryRow} from "./OrdersHistoryRow"
import {OrdersResetButton} from "./OrdersResetButton"

import type {OrdersHistoryEntry} from "../../types"
import {OrdersEmptyState} from "../states/OrdersEmptyState"

type OrdersHistoryListProps = {
  onRefresh: () => void
  onReset: () => void
  orders: OrdersHistoryEntry[]
  refreshing: boolean
  resetting: boolean
}

const getOrdersCountLabel = (count: number) =>
  count === 1 ? "1 orden" : `${count} órdenes`

const OrdersHistoryListHeader = ({
  onReset,
  ordersCount,
  pendingCount,
  resetting,
}: Pick<OrdersHistoryListProps, "onReset" | "resetting"> & {
  ordersCount: number
  pendingCount: number
}) => {
  return (
    <View className="gap-lg px-street">
      <View className="gap-lg pt-lg">
        <Row className="gap-lg items-start justify-between">
          <View className="gap-xs min-w-0 flex-1">
            <Text className="text-muted-foreground text-xs font-semibold uppercase">
              Actividad
            </Text>
            <Text selectable className="text-foreground text-3xl font-bold">
              Órdenes
            </Text>
            <Text
              selectable
              className="text-muted-foreground text-sm leading-5"
            >
              Historial completo de órdenes enviadas, ejecutadas y pendientes.
            </Text>
          </View>

          <View className="border-primary/20 bg-primary/10 h-12 w-12 items-center justify-center rounded-lg border">
            <Icon as={ReceiptText} className="text-primary size-6" />
          </View>
        </Row>

        <Row className="gap-md items-center justify-between">
          <View className="gap-xs min-w-0 flex-1">
            <Text className="text-foreground text-sm font-semibold">
              {getOrdersCountLabel(ordersCount)}
            </Text>
            <Text className="text-muted-foreground text-xs leading-4">
              {pendingCount > 0
                ? `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"} de ejecución`
                : "Sin órdenes pendientes"}
            </Text>
          </View>
          <OrdersResetButton onConfirm={onReset} resetting={resetting} />
        </Row>
      </View>
    </View>
  )
}

export const OrdersHistoryList = ({
  onRefresh,
  onReset,
  orders,
  refreshing,
  resetting,
}: OrdersHistoryListProps) => {
  const pendingCount = orders.filter(order => order.status === "PENDING").length

  return (
    <FlashList
      contentInsetAdjustmentBehavior="never"
      contentContainerClassName="pb-safe pt-safe"
      data={orders}
      keyExtractor={order => order.id}
      ListEmptyComponent={<OrdersEmptyState />}
      ListHeaderComponent={
        <OrdersHistoryListHeader
          onReset={onReset}
          ordersCount={orders.length}
          pendingCount={pendingCount}
          resetting={resetting}
        />
      }
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderItem={({item}) => <OrdersHistoryRow order={item} />}
      showsVerticalScrollIndicator={false}
    />
  )
}
