# Hiba Optics — مركز هبة الطبي للبصريات

Bilingual (Arabic-first, RTL) e-commerce storefront scaffold for an eyewear shop.
Built with Vite + React + TypeScript + Tailwind CSS, deployable on Vercel.

> Status: scaffold only. No backend, database, product data, cart, or images yet.

## Stack

- **Vite + React + TypeScript** — SPA shell.
- **Tailwind CSS** — brand tokens sourced from CSS variables (`src/styles/global.css`).
- **React Router** — single placeholder Home route.

## Conventions

- **Arabic-first / RTL** — `<html dir="rtl" lang="ar">` is the default. Bilingual
  scaffolding lives in `src/lib/i18n.ts` (Arabic primary, English secondary).
- **Fonts** — Tajawal for Arabic, Inter for Latin text and numbers.
- **Western digits** — numbers always render as `0-9` (never Arabic-Indic).
  Wrap numeric runs in the `.num` helper class.
- **Brand colors** — defined once as CSS variables in `:root`; never hardcode hex
  in components. Reference the Tailwind tokens (`gold`, `black`, etc.) instead.

## Structure

```
src/
  components/   reusable UI (Wordmark)
  pages/        route pages (Home)
  lib/          shared logic (i18n scaffolding)
  styles/       global.css — brand tokens + base RTL styles
```

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Deployment

`vercel.json` includes an SPA fallback rewrite so all routes serve `index.html`.
