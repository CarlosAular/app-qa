# Instrument Detail Page Overrides

> **PROJECT:** Cocos  
> **Page Type:** Instrument Detail / Order Ticket

> Rules here **override** [`MASTER.md`](../MASTER.md) where noted.

---

## Layout

- Vertical scroll: header card → price chart → order form
- Section gap: `gap-lg`
- Horizontal padding: `px-street`

## Color

- Hero price: `text-3xl font-bold text-foreground`
- Return badge: pill with profit/loss tints
- Submit CTA: purple accent button (`variant="accent"`)

## Chart

- Section title: "Variación del día"
- Chart container uses `ChartContainer` with dark card shell
- Line color: `--color-chart-1` (gold)
- Grid: `--color-chart-grid`

## Order form

- Buy/sell segmented control: gold / destructive
- Order type selected: purple accent segment
- Quantity mode selected: gold primary segment

## CTA

- Sticky submit at bottom of scroll content
- Min height 44px, purple background

## Avoid

- Light chart grid colors
- Default blue primary buttons for submit
