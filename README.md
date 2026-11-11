# Melt Calculator

meltcalculator.plainsmadeco.com, a free coin melt value site by PlainsMadeCo.

- `coins.py` coin data (weights and purity; fine content is derived, not typed)
- `fetch_spot.py` pulls gold and silver spot into `docs/data/spot.json` (keeps the last good price on failure)
- `build.py` writes the static site into `docs/`
- `.github/workflows/refresh.yml` runs both twice a day and commits the result; GitHub Pages serves `docs/`
