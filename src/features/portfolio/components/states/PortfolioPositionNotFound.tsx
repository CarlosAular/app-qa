import {Button} from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {Text} from "@/components/ui/text"

type PortfolioPositionNotFoundProps = {
  onGoBack: () => void
}

export const PortfolioPositionNotFound = ({
  onGoBack,
}: PortfolioPositionNotFoundProps) => {
  return (
    <Card className="mx-street mt-lg">
      <CardHeader>
        <CardTitle className="text-lg">Posición no encontrada</CardTitle>
        <CardDescription className="leading-5">
          No encontramos esta posición en tu portafolio actual.
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-0">
        <Button className="min-h-11 self-start" onPress={onGoBack}>
          <Text>Volver a Portafolio</Text>
        </Button>
      </CardFooter>
    </Card>
  )
}
