import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const MarketsEmptyState = () => {
  return (
    <Card className="border-border/80 bg-card/90 mx-street mt-md">
      <CardHeader>
        <CardTitle className="text-lg">Sin instrumentos disponibles</CardTitle>
        <CardDescription className="leading-5">
          Cuando la API devuelva activos, van a aparecer en esta lista.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
