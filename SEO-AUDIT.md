# AskPaperGen — on-site SEO / AEO / GEO review

Method: the on-site workflow from the BeyondSEO skill (https://github.com/beyondtahir/beyondseo) — inspect each page, state evidence, apply a fix, then re-check. The skill's own crawler was **not** run (it needs Python, Chromium and network access); a local headless-browser check of the five built pages was used instead.

## What was applied
- **Unique titles and meta descriptions** for all five pages (they previously shared one description).
- **Canonical URLs**, robots meta, Open Graph and Twitter card tags, plus a 1200×630 share image (`assets/images/og-image.png`).
- **Structured data (JSON-LD)** using consistent entity IDs: WebSite, Organization, Person (developer), SoftwareApplication, per-page WebPage subtypes with breadcrumbs, and a **FAQPage that mirrors the visible FAQ exactly**. Developer `sameAs` lists only the verified portfolio URL.
- **Answer-ready content (AEO):** "What is AskPaperGen?" and "Who is it for?" added as the first FAQ items.
- **Crawl files:** `robots.txt` and `sitemap.xml` (canonical URLs only).
- **Headings:** one H1 per page, no skipped levels. Alt text present on all images.

## Local check results
| Check | index | generator | templates | about | contact |
|---|---|---|---|---|---|
| Title 30–65 chars | ✅ | ✅ | ✅ | ✅ | ✅ |
| Meta description 70–165 chars | ✅ | ✅ | ✅ | ✅ | ✅ |
| Canonical (absolute) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Robots meta | ✅ | ✅ | ✅ | ✅ | ✅ |
| Open Graph + Twitter card | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exactly one H1 | ✅ | ✅ | ✅ | ✅ | ✅ |
| No skipped heading levels | ✅ | ✅ | ✅ | ✅ | ✅ |
| Images have alt | ✅ | ✅ | ✅ | ✅ | ✅ |
| JSON-LD parses | ✅ | ✅ | ✅ | ✅ | ✅ |
| html lang set | ✅ | ✅ | ✅ | ✅ | ✅ |
| FAQ schema mirrors visible FAQ | ✅ | — | — | — | — |

## Not done / not measurable here
- Live indexing, rankings, search impressions and AI-answer citations — these need real search-console and monitoring data. Nothing here guarantees ranking.
- Off-site work (backlinks, publishing plan, competitor and reputation research) — the skill covers this, but it needs live web research and your authorisation to publish.
- Canonical, sitemap and schema use `https://ahsanamingorsi.github.io/AskPaperGen/`. If you move to a custom domain, replace that address in all five HTML files, `sitemap.xml` and `robots.txt`. Note: crawlers only read `robots.txt` at a domain root, so on github.io project pages it has no effect; submit `sitemap.xml` in Google Search Console instead.
