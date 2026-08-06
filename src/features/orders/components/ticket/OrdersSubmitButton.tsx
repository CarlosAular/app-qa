import {RefreshCcw, Send} from "lucide-react-native"

import {Button} from "@/components/ui/button"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

type OrdersSubmitButtonProps = {
  disabled: boolean
  isPending: boolean
  hasResult: boolean
  onPress: () => void
  onReset: () => void
}

export const OrdersSubmitButton = ({
  disabled,
  hasResult,
  isPending,
  onPress,
  onReset,
}: OrdersSubmitButtonProps) => {
  const label = isPending
    ? "Enviando..."
    : hasResult
      ? "Enviar otra orden"
      : "Enviar orden"

  return (
    <Button
      accessibilityRole="button"
      className="min-h-10 w-full"
      disabled={disabled}
      onPress={hasResult ? onReset : onPress}
      size="default"
      variant="accent"
    >
      <Icon as={hasResult ? RefreshCcw : Send} />
      <Text>{label}</Text>
    </Button>
  )
}
