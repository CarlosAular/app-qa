import {View} from "react-native"

import {AlertCircle} from "lucide-react-native"

import {Button} from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {Icon} from "@/components/ui/icon"
import {Text} from "@/components/ui/text"

type SearchErrorStateProps = {
  message: string
  onRetry: () => void
}

export const SearchErrorState = ({message, onRetry}: SearchErrorStateProps) => {
  return (
    <Card className="border-destructive/30 bg-destructive/10 gap-lg py-2xl overflow-hidden">
      <CardHeader className="gap-lg px-lg items-center">
        <View className="border-destructive/25 bg-destructive/15 h-16 w-16 items-center justify-center rounded-lg border">
          <Icon as={AlertCircle} className="text-destructive size-7" />
        </View>
        <View className="gap-sm w-full items-center">
          <CardTitle className="text-center text-xl">
            No pudimos buscar activos
          </CardTitle>
          <CardDescription className="text-center text-base leading-6">
            {message}
          </CardDescription>
        </View>
      </CardHeader>
      <CardFooter className="justify-center pt-0">
        <Button className="px-xl min-h-11" onPress={onRetry}>
          <Text>Reintentar</Text>
        </Button>
      </CardFooter>
    </Card>
  )
}
