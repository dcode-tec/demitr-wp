# WordPress.org Plugin Assets

These files are deployed to the SVN `/assets/` directory and appear on the plugin page.

## Required (generate before submission)

| File | Size | Status |
|------|------|--------|
| `icon.svg` | Vector | DONE (chat bubble) |
| `icon-128x128.png` | 128x128 | TODO — export from icon.svg |
| `icon-256x256.png` | 256x256 | TODO — export from icon.svg |
| `banner-772x250.png` | 772x250 | TODO — "demitr" wordmark on dark bg |
| `banner-1544x500.png` | 1544x500 | TODO — retina version of above |
| `screenshot-1.png` | Any | TODO — settings page screenshot |
| `screenshot-2.png` | Any | TODO — widget on a website |
| `screenshot-3.png` | Any | TODO — consent gate |
| `screenshot-4.png` | Any | TODO — GDPR compliance section |

## How to generate PNGs from SVG

```bash
# Using rsvg-convert (install: brew install librsvg)
rsvg-convert -w 128 -h 128 icon.svg > icon-128x128.png
rsvg-convert -w 256 -h 256 icon.svg > icon-256x256.png
```

## Banner design spec

- Dark background (#0f0d1a)
- "demitr" wordmark centered, white text
- Chat bubble icon to the left
- Tagline: "AI Chat Widget for European Businesses"
- Violet accent (#7c3aed)
