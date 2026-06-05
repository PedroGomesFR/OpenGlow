# Mobile Responsiveness Checklist

Use this checklist for every new page, dashboard panel, and modal in OpenGlow.

## Breakpoints

- `<= 1024px`: tablet and split-screen layouts, especially map and dense dashboards.
- `<= 768px`: default mobile collapse point for grids, sidebars, and action bars.
- `<= 480px`: small-phone tightening for spacing, stacked controls, and reduced panel padding.

## Layout Rules

- Do not rely on `100vw` inside pages already wrapped by `.container`; prefer container-aware offsets using shared spacing variables.
- Avoid fixed desktop padding like `40px` on cards and shells without a smaller mobile override.
- Sidebars must become full-width below `768px`; they should not keep desktop fixed widths.
- Any dense grid or calendar needs either a one-column mobile layout or an explicit horizontal scroll wrapper.
- Maps and fullscreen-like sections should use `dvh`-based height calculations and account for header/tab heights.

## Forms And Actions

- Inputs on mobile should render at `16px` font size to avoid iOS zoom.
- Primary action buttons should become full-width when horizontal space gets tight.
- Multi-button toolbars should stack or scroll horizontally instead of wrapping into cramped rows.
- Password and settings forms should collapse multi-column groups to one column below `768px`.

## Content And Cards

- Email addresses, long names, and addresses need `overflow-wrap` or truncation rules.
- Card footers with actions should allow wrapping and keep tap targets at least `44px` tall.
- Image galleries should reduce gap and column count on small phones.
- Empty states and modals should reduce padding below `480px`.

## Validation Pass

- Check `/`, `/recherche`, `/map` at phone width on every public-flow change.
- Check authenticated routes touched by the change with a `390px`-wide viewport.
- Confirm there is no horizontal page overflow.
- Confirm the main action on each touched page remains visible without awkward zooming.
- Confirm sticky headers, floating widgets, and notification panels do not cover primary content.