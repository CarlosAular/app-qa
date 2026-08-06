import {Platform, TextInput, View} from "react-native"

import {BottomSheetTextInput} from "@gorhom/bottom-sheet"

import {Text} from "@/components/ui/text"
import {cn} from "@/lib/utils"

import {OrdersFieldError} from "./OrdersFieldError"

import {
  ordersDecimalInputSchema,
  ordersIntegerInputSchema,
} from "../../orderValidation"

type OrdersNumberInputMode = "decimal" | "integer"

type OrdersNumberInputProps = {
  disabled?: boolean
  error?: string
  label: string
  mode?: OrdersNumberInputMode
  onChangeText: (value: string) => void
  onSubmitEditing?: () => void
  placeholder: string
  useBottomSheetInput?: boolean
  value: string
}

const inputClassName = cn(
  "border-input bg-panel text-foreground flex h-10 w-full min-w-0 flex-row items-center rounded-md border px-3 py-1 font-sans text-sm leading-5",
  Platform.select({
    native: "placeholder:text-muted-foreground/50",
  })
)

export const OrdersNumberInput = ({
  disabled = false,
  error,
  label,
  mode = "decimal",
  onChangeText,
  onSubmitEditing,
  placeholder,
  useBottomSheetInput = false,
  value,
}: OrdersNumberInputProps) => {
  const InputComponent = useBottomSheetInput ? BottomSheetTextInput : TextInput
  const inputSchema =
    mode === "integer" ? ordersIntegerInputSchema : ordersDecimalInputSchema

  return (
    <View className="gap-xs">
      <Text className="text-muted-foreground text-xs font-medium">{label}</Text>
      <InputComponent
        accessibilityLabel={label}
        blurOnSubmit
        className={cn(inputClassName, disabled && "opacity-50")}
        editable={!disabled}
        // decimal-pad keeps the locale decimal key so fractional share input
        // reaches validation instead of being dropped before onChangeText.
        // returnKeyType=send still shows Send on iOS for this pad.
        keyboardType="decimal-pad"
        onChangeText={nextValue => onChangeText(inputSchema.parse(nextValue))}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        returnKeyType="send"
        value={value}
      />
      <OrdersFieldError message={error} />
    </View>
  )
}
