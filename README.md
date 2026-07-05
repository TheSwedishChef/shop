# @cl/shop

Shared, Square-backed shop components for **Hygiene** (hygiene.hiphop) and **SGSS**
(slurpgulpandstartonsounds.com). Astro components + a small Square client. **Theme-agnostic
and contains no secrets** — each site themes it with CSS variables and supplies its own
Square token via Cloudflare env vars.

> Scoped as `@cl/shop` (the GitHub repo stays `shop`). The scope avoids a name clash
> with an unrelated global npm package called `shop`. Not affiliated with chrislorensson.com;
> this package is only for Hygiene & SGSS.

## How it's used
Each site consumes this repo as a git dependency and imports components:

```jsonc
// a site's package.json
"dependencies": { "@cl/shop": "github:TheSwedishChef/shop#main" }
```

```astro
---
// utilities/data via the main entry; components via subpath
import { mockCatalog } from "@cl/shop";
import ProductGrid from "@cl/shop/components/ProductGrid.astro";
---
<ProductGrid products={mockCatalog} basePath="/shop" />
```

Fix a bug here once → both sites pick it up on their next build.

### Local development
Because the two sites are separate repos, use `npm link` to work against local source:

```bash
cd ~/Sites/Shop && npm link          # register @cl/shop globally
cd <a-site> && npm link @cl/shop     # point the site at your local copy
```

(Re-run the site's `npm link @cl/shop` after any `npm install`, which restores the
git-dependency copy.)

## Theming contract
Components only read `--shop-*` tokens (with neutral fallbacks). A site maps its own
palette onto them:

```css
:root {
  --shop-bg: var(--paper);
  --shop-ink: var(--ink);
  --shop-accent: var(--blue);
  --shop-rule: var(--rule);
  --shop-font: var(--sans);
  --shop-radius: 5px;
}
```

| Token | Purpose |
|---|---|
| `--shop-bg` / `--shop-ink` | card surface + text |
| `--shop-accent` | price, emphasis |
| `--shop-rule` | borders |
| `--shop-radius` | corner rounding |
| `--shop-font` | type |
| `--shop-gap` / `--shop-min` | grid spacing + min column width |
| `--shop-soldout-bg` / `--shop-soldout-ink` | sold-out badge |

## Status
Phase 1 — components render from `mockCatalog`. Square (catalog at build, live-inventory
island, hosted checkout) lands in Phase 3; the component API won't change when it does.
