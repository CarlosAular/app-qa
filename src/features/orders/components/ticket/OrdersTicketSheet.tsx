import {BottomSheetScrollView} from "@gorhom/bottom-sheet"

import {OrdersTicketForm} from "./OrdersTicketForm"

import type {OrdersInstrument} from "../../types"

type OrdersTicketSheetProps = {
  dismiss?: () => Promise<void>
  instrument: OrdersInstrument
}

export const OrdersTicketSheet = ({instrument}: OrdersTicketSheetProps) => {
  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className="pb-safe"
      contentContainerClassName="gap-md pb-safe pt-sm"
    >
      <OrdersTicketForm instrument={instrument} useBottomSheetInputs />
    </BottomSheetScrollView>
  )
}
