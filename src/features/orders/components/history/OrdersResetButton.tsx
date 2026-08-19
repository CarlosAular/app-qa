import {Alert} from "react-native"

import {RotateCcw} from "lucide-react-native"

import {Button} from "@/components/ui/button"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

type OrdersResetButtonProps = {
  onConfirm: () => void
  resetting: boolean
}

export const OrdersResetButton = ({
  onConfirm,
  resetting,
}: OrdersResetButtonProps) => {
  const handlePress = () => {
    Alert.alert(
      "Reiniciar cuenta",
      "Se borran todas tus órdenes y el portafolio vuelve al efectivo inicial. No se puede deshacer.",
      [
        {style: "cancel", text: "Cancelar"},
        {onPress: onConfirm, style: "destructive", text: "Reiniciar"},
      ]
    )
  }

  return (
    <Button
      accessibilityLabel="Reiniciar cuenta"
      className="min-h-11 self-start"
      disabled={resetting}
      onPress={handlePress}
      variant="outline"
    >
      <Icon
        accessibilityElementsHidden
        as={RotateCcw}
        className="text-foreground size-4"
      />
      <Text>{resetting ? "Reiniciando…" : "Reiniciar"}</Text>
    </Button>
  )
}
