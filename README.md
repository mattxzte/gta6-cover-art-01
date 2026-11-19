# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/mattxzte/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/mattxzte/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Sunset Cover — turn your own photo into GTA-style Vice City sunset poster art: three multi-panel layouts, crop and position every photo, a bold Anton caption, sunset / neon / noir colour grades, and one-click PNG export in 1080 × 1080, 1080 × 1350 and 1920 × 1080. Fully offline — every file the app loads ships under `app/`, and your photos never leave your machine.

## Run it

```sh
python3 -m http.server 8080 --directory app
# open http://localhost:8080 in desktop Chrome
```

## How it works

1. **Add photos** — pick files from your machine (or try the three built-in sample scenes, original artwork drawn in code). Click a thumbnail to place it in the selected panel.
2. **Pick a layout and size** — Vice Grid, Sunset Strip or Neon Trio; square, portrait or widescreen.
3. **Write the caption** — title, subtitle and title colour, plus a colour grade with a strength slider.
4. **Crop each panel** — click a panel in the live preview, drag to move its photo, scroll to zoom, or use the sliders.
5. **Export PNG** — the cover is drawn on a canvas at full export size, so what you preview is exactly what you share.

The display font is Anton, shipped under `app/fonts/` under the SIL Open Font License (`app/fonts/OFL.txt`). No Rockstar logos, artwork, characters or fonts are used anywhere; the sample photos are original scenes drawn with code, not photographs of real people.

---

<sub>Entered on [make.fun](https://make.fun/?ref=nv10mx49&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
