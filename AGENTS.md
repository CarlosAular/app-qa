# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Project Architecture Rules

These rules are mandatory for every new feature, component, API request, query,
mutation, hook, screen, and feature-local helper.

## Feature structure

- Put every new feature under `src/features/<feature-name>/`.
- Add these folders only when the feature needs them:
  - `api/` for raw HTTP calls.
  - `queries/` for TanStack Query keys and query option factories.
  - `hooks/` for UI-facing query and mutation hooks.
  - `components/` for feature-specific presentational components, containers
    that are not route-level screens, and proxy components.
  - feature-local helpers/types when they are not shared across features.
- Before copying any pattern from `src/features/home-example/`, verify imports and
  package availability against the live repo. Some files in that folder may
  reference packages or components that are not installed in this project.

## Route and data boundary

- Route files in `src/app/` own screen/container composition for their route.
- Route files may load TanStack Query hooks through
  `src/features/<feature>/hooks/`, derive route-local state, and wire navigation
  callbacks.
- Do not create repo-owned components, files, or exports named `Screen` or
  ending in `Screen`.
- Feature containers that are not route-level screens may exist when they serve
  a narrower domain purpose, but route-level screen wrappers belong in
  `src/app/`.
- Presentational feature components receive plain props: data, loading state,
  error state, selected values, and handlers.
- Presentational feature components must not import API functions or TanStack
  Query hooks.

## Data layer

- `src/features/<feature>/api/*.api.ts` owns raw HTTP calls through
  `src/config/api.config.ts`.
- API functions must validate or normalize response data before returning it.
- `src/features/<feature>/queries/*Queries.ts` owns query keys and TanStack
  Query option factories for the feature.
- Query files must use the built-in `queryOptions` and `infiniteQueryOptions`
  helpers from `@tanstack/react-query`.
- Query keys must be explicit readonly arrays and include every variable used by
  the query function.
- Infinite query factories must define `initialPageParam` and
  `getNextPageParam`.
- UI hooks should call query factories directly, such as
  `useQuery(featureQueries.detail(id))`, or spread the factory result only when
  adding hook-local options.
- Do not introduce external query-key factory packages unless the dependency is
  intentionally installed and documented for this project.
- `src/features/<feature>/hooks/useXQuery.ts` and
  `src/features/<feature>/hooks/useXMutation.ts` are the only UI-facing places
  that import `useQuery`, `useInfiniteQuery`, or `useMutation`.
- Mutation hooks must invalidate or update every affected feature query.

## Proxy components

- Feature UI must wrap shared design-system components from `src/components/`
  behind feature-named abstractions.
- Every feature component file and exported component name must start with the
  feature prefix in PascalCase. Derive the prefix from the feature folder name:
  `markets` -> `Markets`, `orders` -> `Orders`, `trading-home` ->
  `TradingHome`.
- Use domain names such as `MarketsInstrumentRow`,
  `MarketsInstrumentPriceCell`, `PortfolioAssetRow`, or `OrdersTypeSelector`
  instead of exposing generic design-system composition throughout a screen.
- Screens should not repeatedly assemble primitives like `Row`, `Column`,
  `Text`, and `Money` for repeated domain UI when a feature-named proxy
  component can express the intent.
- Proxy components must have typed props, descriptive feature/domain names, and
  no direct data fetching.

## Styling

- Use Uniwind literal `className` strings or `class-variance-authority` (`cva`).
- Do not construct Tailwind class names dynamically.
- Do not use NativeWind-only APIs such as `cssInterop` unless the dependency is
  intentionally installed and documented for this project.

## Post-edit formatting

- Project-local Codex and Cursor hooks must run the shared formatter after agent
  edits.
- The shared formatter lives at `scripts/format-after-edit.mjs`.
- Keep Codex and Cursor hook configuration pointed at that script so both tools
  format code the same way.
- Use `bun run format` for full-repo formatting and `bun run format:check` for
  a full-repo formatting check.

## UI verification

- Use the Argent MCP workflow for native UI verification of this Expo app.
- Prefer Argent device discovery tools (`describe`, `debugger-component-tree`,
  and `screenshot`) before interacting with the app.
- Do not use Playwright MCP as the primary UI verification path for native app
  flows in this project.
- Keep Metro on port `8081` for Argent verification unless the user explicitly
  requests another port.
