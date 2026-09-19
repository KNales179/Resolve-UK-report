# Resolve UK Reports

A small static website that holds the progress reports and planning documents
for **Resolve UK**, a citizen environmental-reporting platform for the UK.
Citizens report issues such as fly-tipping and potholes with a photo, a short
description and a location, and follow what happens until the issue is
resolved.

This repository contains documents only. The application itself lives in a
separate repository.

## Contents

| Page | What it is |
|---|---|
| `/` | Index of all reports, newest first |
| `/week-1/` | Week 1 status report: what shipped, the development plan, risks, and questions |
| `/blueprint/` | Draft system plan: how a report moves, order of work, where this leads, answers to Ms Kay's questions, questions for Ms Kay, and a technical appendix with the data model |
| `/assets/` | Shared stylesheet and script used by every page |

Every page has a light/dark button. The default follows the system setting, and
a manual choice is only kept while moving between pages, so a refresh returns
to the system setting.

## Hosting

Plain HTML with no build step, so it deploys as-is to any static host. On
Vercel, choose the "Other" framework preset and leave the build command and
output directory empty. The blueprint page loads the Mermaid diagram library
from a CDN, so it needs an internet connection to draw its diagrams.

## Adding a report

1. Copy an existing folder (for example `week-1/`) and rename it.
2. Edit its `index.html`. The page links to `../assets/site.css` and `../assets/site.js`, so keep it one folder deep.
3. Add an entry for it to the root `index.html`.

## License

See [LICENSE](./LICENSE). All rights reserved. This repository is provided for
viewing purposes only.
