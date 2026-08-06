import {AlertCircle} from "lucide-react-native"

import {Row} from "@/components/Row"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

type OrdersFieldErrorProps = {
  message: string | undefined
}

export const OrdersFieldError = ({message}: OrdersFieldErrorProps) => {
  if (!message) {
    return null
  }

  return (
    <Row className="gap-xs items-start">
      <Icon as={AlertCircle} className="text-destructive mt-[2px] size-4" />
      <Text selectable className="text-destructive flex-1 text-sm leading-5">
        {message}
      </Text>
    </Row>
  )
}
