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

type PortfolioErrorStateProps = {
  message: string
  onRetry: () => void
}

export const PortfolioErrorState = ({
  message,
  onRetry,
}: PortfolioErrorStateProps) => {
  return (
    <View className="bg-background pt-safe flex-1">
      <Card className="border-destructive/30 bg-destructive/10 mx-street mt-lg overflow-hidden">
        <CardHeader>
          <Icon as={AlertCircle} className="mb-sm text-destructive size-6" />
          <CardTitle className="text-lg">
            No pudimos cargar el portfolio
          </CardTitle>
          <CardDescription className="leading-5">{message}</CardDescription>
        </CardHeader>
        <CardFooter className="pt-0">
          <Button className="min-h-11 self-start" onPress={onRetry}>
            <Text>Reintentar</Text>
          </Button>
        </CardFooter>
      </Card>
    </View>
  )
}
