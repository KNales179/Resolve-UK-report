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

## Comments (Supabase)

The blueprint has an answer box under each of the questions for Ms Kay, a box for the
smaller decisions, and a comments box at the end. The Week 1 report has a box under
each of its questions and a comments box too. They save to a small Supabase database,
so Ms Kay can answer from the page and you can read and reply to everything in one
place. A static website can't store anything by itself, which is why a database is needed.

The database is already set up. The `reports_site_comments` table and the two functions
that read and save answers (`get_my_site_comments` and `save_my_site_comment`) were created
by `supabase/schema.sql` in the Celestial Companions reports repository. That file does not
need to be run again, and this repository does not contain a copy. The project URL and the
public key are in `assets/comments-config.js`. The key is meant to be public. Never put the
`service_role` key in this repository.

Each page labels its answers with its own key (`data-report` on the script tag), so the two
report sites and both pages share one table without mixing:

| Page | Key |
|---|---|
| `/blueprint/` | `resolve-blueprint` |
| `/week-1/` | `resolve-week-1` |

Filter by the `report` column in the Table Editor to see one page at a time.

How a box behaves: it starts as an empty input. After she saves, the input is replaced by
what she wrote. The pen icon, or a double-click on the text, turns it back into an input with
Save and Cancel (Esc also cancels). Each reader gets one answer per box, and changing it
updates that row. The `updated_at` column shows when it was last edited.

Reading and replying: open Table Editor > `reports_site_comments`. Every answer and
comment is a row. To reply, type into that row's `reply` cell; the reply appears under her
answer on the page the next time she opens it.

How it stays private: nobody can read or write the table directly. Each browser makes up a
private random id, and the page can only save and fetch answers under that id, through the
two functions. So Ms Kay sees her own answers (and your replies) on the device she wrote
them on, and no one else's. If she switches device she will not see her earlier answers
there, though you still will.

Until the two values in `assets/comments-config.js` are filled in, the boxes still show but
are greyed out and marked "Preview only: saving is not switched on yet."

## License

See [LICENSE](./LICENSE). All rights reserved. This repository is provided for
viewing purposes only.
