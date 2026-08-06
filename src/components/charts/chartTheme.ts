import {Uniwind} from "uniwind"

export const CHART_HEIGHT = 240

export const getChartPrimaryColor = () =>
  String(Uniwind.getCSSVariable("--color-chart-1") ?? "#2dd4bf")

export const getChartGridColor = () =>
  String(Uniwind.getCSSVariable("--color-chart-grid") ?? "#1e293b")

export const getChartFrameColor = () =>
  String(Uniwind.getCSSVariable("--color-chart-frame") ?? "#334155")

export const getChartLabelColor = () =>
  String(Uniwind.getCSSVariable("--color-chart-label") ?? "#9aa7bd")

export const getChartProfitColor = () =>
  String(Uniwind.getCSSVariable("--color-profit") ?? "#34d399")

export const getChartLossColor = () =>
  String(Uniwind.getCSSVariable("--color-loss") ?? "#f87171")

export const getChartNeutralColor = () =>
  String(Uniwind.getCSSVariable("--color-chart-2") ?? "#38bdf8")
