# Claude in Chrome prompt: finishing touches (both sites)

The sites are live (Vercel, lorcanacompare.com and gundamcompare.com) and the
daily import with eBay runs on GitHub Actions. Since 2026-10-25 there are no
accounts, no Premium, no email and no database, so Neon, Resend, Stripe and
Google sign-in need nothing. What's left is search engines and analytics.

```text
Two websites I own are live on Vercel: lorcanacompare.com (repo Specifxx/LorcanaCompare) and
gundamcompare.com (repo Specifxx/GundamCompare). Do the steps below for BOTH.
Rules: don't buy or delete anything, and don't touch riftcompare.com. If you get stuck on a step
(login, 2FA, a plan upgrade, anything unclear), leave that tab open, note it, and move on.
At the end, list DONE and NEEDS YOU (each open tab and exactly what I must do there).

1. Vercel → each project → Analytics → Enable Web Analytics (if not already on), then
   Deployments → latest → ⋯ → Redeploy. Buy-button clicks arrive as the custom event
   "buy_click" (properties retailer, market, product, page); custom events need the Pro plan.
   If the team is on Hobby, say so; don't upgrade.
2. Vercel → each project → Settings → Environment Variables: these are no longer used and can be
   deleted if present: DATABASE_URL, AUTH_SECRET, RESEND_API_KEY, EMAIL_FROM, STRIPE_*,
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, PAYMENTS_ENABLED. Keep NEXT_PUBLIC_SITE_URL,
   EBAY_VERIFICATION_TOKEN, EBAY_AFFILIATE_CAMPAIGN, TCGPLAYER_IMPACT_LINK, INDEXNOW_KEY.
   (GitHub secrets: keep EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_AFFILIATE_CAMPAIGN, INDEXNOW_KEY;
   DATABASE_URL, RESEND_API_KEY, EMAIL_FROM, STRIPE_SECRET_KEY can go.)
3. Google Search Console: if the Domain property for each site isn't verified yet, add it
   (TXT record in Vercel → Domains → DNS Records). Submit https://lorcanacompare.com/sitemap.xml
   and https://gundamcompare.com/sitemap.xml. URL inspection → Request indexing for each site's
   /, /cards, /sets, /preorders, /tools, /tools/deal-finder, /tools/rising, /tools/best-basket,
   and every page under /blog.
4. Bing Webmaster Tools: Add site → Import from Google Search Console (both). Submit both sitemaps.
5. Check the link previews: paste https://lorcanacompare.com and https://gundamcompare.com into
   https://www.opengraph.xyz and confirm the thumbnail shows the site's logo, "Compare … prices"
   headline and the price-table screenshot. If an old preview shows, it is cached; note it.
6. On each site, click a Buy button on a card page and confirm it opens the store (eBay links
   contain "campid=", TCGplayer links go through partner.tcgplayer.com).
```
