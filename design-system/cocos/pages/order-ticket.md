# Order Ticket Page Overrides

> **PROJECT:** Cocos  
> **Page Type:** Order Ticket Bottom Sheet

> Rules here **override** [`MASTER.md`](../MASTER.md) where noted.

---

## Sheet chrome

- Background: `bg-card` via bottom sheet theme (`--color-card`)
- Handle indicator: `--color-muted-foreground`, 40×4px pill
- Backdrop opacity: 0.65
- Horizontal padding: `px-street`

## Header

- Title: `text-xl font-bold tracking-tight text-foreground`
- Subtitle: `text-sm leading-5 text-muted-foreground`
- Bottom divider: `border-border border-b pb-lg`

## Instrument summary

- Compact card with ticker avatar, accent border (`border-primary/15`)
- Price: `text-lg font-semibold tabular-nums`
- Type label: uppercase muted caption

## Segmented controls

- Track: `border-border bg-background/50 border rounded-lg p-xs`
- Segment min height: 44px, `rounded-md`, `active:opacity-70`
- Buy selected: gold primary; sell selected: destructive
- Order type selected: purple accent
- Quantity mode selected: gold primary

## Inputs

- `bg-muted/50 border-border h-12 rounded-lg`
- Labels: `text-sm font-medium text-muted-foreground`

## Order summary

- Inset card: `border-accent/20 bg-muted/20`
- Quantity value: `text-2xl font-bold tabular-nums`
- Estimated total: muted caption below

## CTA

- Full width purple accent button, min height 44px

## Avoid

- White sheet backgrounds
- Low-contrast header text on light surfaces
- Mixed unstyled default bottom sheet chrome
