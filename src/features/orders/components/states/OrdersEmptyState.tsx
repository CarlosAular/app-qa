import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const OrdersEmptyState = () => {
  return (
    <Card className="border-border/80 bg-card/90 mx-street mt-md">
      <CardHeader>
        <CardTitle className="text-lg">Todavía no enviaste órdenes</CardTitle>
        <CardDescription className="leading-5">
          Cuando operes desde Mercados, Portafolio o Buscar, tus órdenes van a
          aparecer en esta lista.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
