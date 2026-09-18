# Responsive Validation Record

Validated locally on 2026-09-17 after the responsive remediation.

| Viewport | Result |
|---|---|
| 375 px mobile | Hero, header CTA, typography, and CTA wrap within the viewport without horizontal document overflow. |
| 430 px mobile | Responsive grid collapses to a single column. Video player containers retain a 16:9 ratio. |
| 1440 px desktop | The hero uses balanced two-column layout, primary navigation is visible, and the illustrative panel remains inside the content container. |

The comparison table intentionally retains a fixed minimum width within `.table-scroll`; the parent provides its own horizontal scrolling and does not increase the document width. All three Gumlet player frames are responsive `aspect-ratio: 16 / 9` containers. Generated WebP images load at 2560×1440 with explicit `width`, `height`, `alt`, and `loading="lazy"` attributes.

Viewport screenshots were reviewed for the 375 px mobile and 1440 px desktop hero states. Both showed an intact header, readable CTA, and no page-level horizontal clipping. The player endpoints each returned HTTP 200, and DOM measurement confirmed each player frame has a 1.778 (16:9) ratio at the mobile and desktop breakpoints.
