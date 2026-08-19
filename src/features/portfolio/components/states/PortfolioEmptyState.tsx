import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const PortfolioEmptyState = () => {
  return (
    <Card className="border-border/80 bg-card/90 mx-street mt-md">
      <CardHeader>
        <CardTitle className="text-lg">
          No hay posiciones en el portfolio
        </CardTitle>
        <CardDescription className="leading-5">
          Cuando la API devuelva tenencias, van a aparecer en esta lista.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
