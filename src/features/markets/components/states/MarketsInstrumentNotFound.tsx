import {Button} from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {Text} from "@/components/ui/text"

type MarketsInstrumentNotFoundProps = {
  onGoBack: () => void
}

export const MarketsInstrumentNotFound = ({
  onGoBack,
}: MarketsInstrumentNotFoundProps) => {
  return (
    <Card className="mx-street mt-lg">
      <CardHeader>
        <CardTitle className="text-lg">Instrumento no encontrado</CardTitle>
        <CardDescription className="leading-5">
          No encontramos este instrumento en la lista actual del mercado.
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-0">
        <Button className="min-h-11 self-start" onPress={onGoBack}>
          <Text>Volver a Mercados</Text>
        </Button>
      </CardFooter>
    </Card>
  )
}
