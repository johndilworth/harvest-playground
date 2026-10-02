# Harvest Playground

A mostly empty web page that John's team fills in through Harvest cycles: anyone leaves a sticky on the cycle board in Lucid,
the stickies are harvested at 5pm MT daily, safe requests are applied and merged, and a new board appears by morning.

- Site: `site/` (static HTML/CSS, no build). Production deploys from `main`.
- Rules for the nightly harvest: [HARVEST.md](HARVEST.md). Per-cycle log: [CHANGELOG.md](CHANGELOG.md).
- Journey tooling and per-cycle board records: `journey/` (`journey/cycles/<N>/lucid-doc.json`).
