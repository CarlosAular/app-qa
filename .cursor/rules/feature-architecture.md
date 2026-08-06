---
description: Feature architecture, data loading, proxy component, and formatting rules
alwaysApply: true
---

# Feature Architecture Rules

Read `AGENTS.md` before changing code. These Cursor rules mirror the repo-level
Codex rules so both agents follow the same conventions.

## Expo

Before writing Expo-specific code, read the exact versioned Expo SDK 56 docs:
https://docs.expo.dev/versions/v56.0.0/

## Features

- Put every new feature under `src/features/<feature-name>/`.
- Use `src/features/home/` as the structural reference.
- Add `api/`, `queries/`, `hooks/`, and `components/` only when the feature
  needs them. Use `components/` for presentational components, non-route
  containers, and feature-named proxy components.
- Verify imports and package availability before copying from `src/features/home/`.

## Routes and data

- Route files in `src/app/` own screen/container composition for their route.
- Route files may load TanStack Query hooks through feature `hooks/`, derive
  route-local state, and wire navigation callbacks.
- Do not create repo-owned components, files, or exports named `Screen` or
  ending in `Screen`.
- Feature containers that are not route-level screens may exist when they serve
  a narrower domain purpose, but route-level screen wrappers belong in
  `src/app/`.
- Presentational feature components receive plain props and must not import API
  functions or TanStack Query hooks.

## Data layer

- `api/*.api.ts` owns HTTP calls through `src/config/api.config.ts`.
- `queries/*Queries.ts` owns query keys and query options.
- `hooks/useXQuery.ts` and `hooks/useXMutation.ts` are the UI-facing query and
  mutation entrypoints.
- Query keys must include every variable used by the query function.
- Mutations must invalidate or update every affected feature query.

## Proxy components

- Wrap shared components from `src/components/` behind feature-named proxy
  components.
- Prefer domain names such as `PortfolioAssetRow`, `InstrumentPriceCell`, or
  `OrderTypeSelector`.
- Proxy components have typed props, no direct API imports, and no TanStack
  Query hook imports.

## Styling and formatting

- Use Uniwind literal `className` strings or `class-variance-authority` (`cva`).
- Do not construct Tailwind class names dynamically.
- Do not use NativeWind-only APIs such as `cssInterop` unless intentionally
  installed and documented.
- Cursor must run the project `afterFileEdit` hook in `.cursor/hooks.json`,
  which delegates to `scripts/format-after-edit.mjs`.
