import {Uniwind} from "uniwind"

export const getBottomSheetBackgroundStyle = () => ({
  backgroundColor: String(Uniwind.getCSSVariable("--color-card") ?? "#0e1223"),
})

export const getBottomSheetHandleIndicatorStyle = () => ({
  backgroundColor: String(
    Uniwind.getCSSVariable("--color-muted-foreground") ?? "#94a3b8"
  ),
  height: 4,
  width: 40,
})
