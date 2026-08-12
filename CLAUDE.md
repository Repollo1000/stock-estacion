# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn dev` — start the Vite dev server
- `yarn build` — type-check (`tsc -b`) then production build via Vite
- `yarn lint` — run oxlint (config in `.oxlintrc.json`)
- `yarn preview` — preview the production build

No test runner is configured in this project.

## Architecture

Single-page React 19 + TypeScript inventory app ("Stock Estación") for tracking product stock across categories. All state lives in `App.tsx` and is passed down as props — there is no state management library, router, or backend.

- **Persistence**: `src/storage.ts` reads/writes the full product list to `localStorage` under the key `productos` (`loadProducts`/`saveProducts`). `App.tsx` loads on mount and re-saves the whole array on every mutation (add/adjust stock/delete) — there's no per-item diffing.
- **Domain model**: `src/types.ts` defines `Producto` (id, barcode, name, category, stock, minStock, ...) and `Categoria = 'ropa' | 'productos' | 'promociones'`. `Usuario` and `FileEstacion` types exist but aren't currently used by any component — auth/multi-station support is not wired up yet.
- **Derived stock status**: `src/utils.ts`'s `getEstado(producto)` classifies a product as `sinStock` | `stockBajo` | `enStock` by comparing `stock` to `minStock`. This is the single source of truth for stock status — used by `StatsCards`, `ProductTable`, and `App`'s filter — recompute via this function rather than re-deriving the comparison inline.
- **Filtering pipeline** in `App.tsx`: products are filtered by active category → status filter → search text (name or barcode substring match), in that order.
- **Components** (`src/components/`): `Sidebar` (category nav + mobile drawer), `StatsCards` (counts by status), `ProductForm` (add product, includes barcode camera scanning via `html5-qrcode`), `ProductTable` (desktop list view with inline stock +/- and delete). `ProductCard.tsx` exists but is currently unused (`ProductTable` is what's rendered).
- **Barcode scanning**: `ProductForm` uses `html5-qrcode`'s `Html5Qrcode` class directly (not the React wrapper). It mounts a `<div id="reader">` and starts the scanner in a `setTimeout(..., 0)` to ensure the div is painted before `html5-qrcode` looks for it in the DOM — keep this pattern if touching scanner init/teardown.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.js` — theme is defined with `@theme` in `src/index.css`). Custom design tokens (`ink`, `paper`, `amber`, `amber-dark`, `teal`, `teal-soft`, `rust`, `rust-soft`, `slate`, `line`) are the palette to use instead of default Tailwind colors.
- Spanish is used throughout for UI copy, variable/function names (e.g. `productosFiltrados`, `handleAdjustStock`), and comments — follow this convention for consistency.
