# Claude in Chrome prompt: YGO Compare first-time setup

Paste everything below the line into Claude in Chrome. Be signed in to Vercel,
GitHub, Google (bill.jyang101@gmail.com), the eBay developer portal and Impact
(TCGplayer affiliate) first. The code, the stores and the daily import are
already on GitHub (`Specifxx/ygocompare`); this is the account-side setup only.

---

You are setting up my new website, YGO Compare (a free Yu-Gi-Oh! card price comparison site). The code is on GitHub at https://github.com/Specifxx/ygocompare and is ready. CHECK FIRST and only do what is missing. Rules: never pay for or buy anything (including the domain), never delete anything, never change or remove an existing DNS record (only ADD records), never touch my other projects (riftcompare, opcompare, mtgcompare, gundamcompare, lorcanacompare, dexcompare, compareempire, camcompare) except to READ a value where a step says so. If a page wants a payment, a phone number, a plan upgrade, or a choice you are unsure about, leave that tab open, note it, and move on. Never show a secret key in your final summary.

## Task 1: Domain

1. I own ygocompare.com. An earlier ygocompare Vercel project was deleted on purpose; Task 2 creates a new one. Open https://vercel.com/dashboard → Domains and note whether ygocompare.com is listed there, and where its DNS is managed (Vercel or another registrar). Don't change anything yet.

## Task 2: Vercel project

1. Vercel → Add New → Project → Import Git Repository → Specifxx/ygocompare (if it isn't listed, use "Adjust GitHub App Permissions" to give Vercel access to that one repository). Framework: Next.js. Leave the build settings at their defaults. Production branch: main.
2. Before the first deploy, open Environment Variables and add these for Production (and Preview):
   - NEXT_PUBLIC_SITE_URL = https://ygocompare.com
   - EBAY_AFFILIATE_CAMPAIGN = 5339155912
   - TCGPLAYER_IMPACT_LINK = copy the exact value from the gundamcompare project (Vercel → gundamcompare → Settings → Environment Variables; click the eye icon to read it). If that project doesn't have it, use https://partner.tcgplayer.com/c/7385758/1780961/21018
   - INDEXNOW_KEY = a new random 32-character string of lowercase letters and digits (make one up; write it down for Task 3)
   - AMAZON_ASSOCIATE_TAG = copy from the gundamcompare project if it has one; otherwise skip.
3. Click Deploy. The first build will show as "Ignored" or "Canceled": that is expected (the site only builds for a release commit). Don't retry it.
4. Project → Settings → Functions: if there is a "Function Region" choice, leave the default. Settings → Deployment Protection: leave as is.
5. Project → Analytics → enable Web Analytics (free tier). If it asks to upgrade the plan, skip.
6. Domain: Project → Settings → Domains → Add → ygocompare.com (the bare domain; it is the site's main address). Do NOT add www.ygocompare.com and do NOT set any redirect. If Vercel asks for DNS records: ADD exactly the records it shows (at Vercel DNS, or at the registrar if the domain's DNS lives there). Never edit or delete an existing DNS record. Wait until Vercel shows "Valid Configuration" for ygocompare.com (refresh every minute or two, up to 15 minutes). If it still isn't valid, note exactly what Vercel says and move on.

## Task 3: GitHub secrets and variables

Open https://github.com/Specifxx/ygocompare/settings/secrets/actions.

1. Secrets tab, New repository secret, for each of these that is missing:
   - EBAY_CLIENT_ID and EBAY_CLIENT_SECRET: the SAME Production keyset that GundamCompare and LorcanaCompare use. GitHub won't show those repos' secret values, so get them from https://developer.ebay.com/my/keys → the Production keyset → App ID (Client ID) and Cert ID (Client Secret). If there is more than one Production keyset, use the one whose App ID matches the one listed for the Gundam/Lorcana app; if you can't tell, stop and ask me.
   - EBAY_AFFILIATE_CAMPAIGN = 5339155912
   - INDEXNOW_KEY = the same string you put in Vercel in Task 2. If this secret already exists (from an earlier setup), click Update and set it to that same new string.
2. Variables tab: SITE_URL = https://ygocompare.com. If SITE_URL already exists with another value (for example https://ygocompare.app), edit it to exactly https://ygocompare.com; otherwise create it.
3. Open https://github.com/Specifxx/ygocompare/settings → General → Default branch. It should be main; if not, switch it to main.

## Task 4: First release

1. The prices are already imported on GitHub. Open https://github.com/Specifxx/ygocompare/actions/workflows/production-deploy.yml → Run workflow (branch main) → Run. It lands a release commit and Vercel builds it (about 3 to 6 minutes). From then on the site rebuilds once a day by itself after the 12:17 UTC price import, which also starts using eBay now that the keys are in.
2. If Vercel shows no new deployment 5 minutes after that run is green, open the Vercel project → Deployments and tell me what the newest entry says.
3. When the Vercel deployment is Ready, open the production URL (and https://ygocompare.com once it shows Valid Configuration). Check: the home page shows card prices; open /cards, click any card, and confirm the price table lists TCGplayer and at least one store; click a Buy button and confirm it opens the store (TCGplayer links go through partner.tcgplayer.com, eBay links contain campid=5339155912).

## Task 5: Search engines (only once ygocompare.com shows Valid Configuration)

1. Google Search Console (https://search.google.com/search-console): Add property → Domain → ygocompare.com. ADD the TXT record where the domain's DNS lives (Vercel → Domains → ygocompare.com → DNS Records, or the registrar), never editing an existing record (Type TXT, Name @, Value = Google's text). Verify (if it fails, wait 2 minutes and try once more). Then Sitemaps → submit https://ygocompare.com/sitemap.xml. Then URL Inspection → Request indexing for https://ygocompare.com/, /cards, /sets, /sealed, /preorders and /blog.
2. In the OP Compare property in Search Console → Settings → Users and permissions, find the user whose email ends in iam.gserviceaccount.com and add the same email as a Full user to the new ygocompare.com property.
3. Bing Webmaster Tools (https://www.bing.com/webmasters): Import from Google Search Console and tick ygocompare.com; then check the sitemap is listed, and add it if not.
4. Yandex Webmaster (https://webmaster.yandex.com): Add site https://ygocompare.com, verify with the DNS (TXT) method, adding the record as above, then Indexing → Sitemap files → add the sitemap.

## Task 6: Affiliate tags

1. Impact (https://app.impact.com) → the TCGplayer program: if it lets you add a website/property, add https://ygocompare.com as a promotional property. Don't change anything else.
2. eBay Partner Network (https://partnernetwork.ebay.com): Campaigns → note whether a campaign named for YGO Compare exists. Do NOT create one (the site uses campaign 5339155912 with a per-site customid, which already separates YGO sales). If EPN asks for a list of websites, add https://ygocompare.com.

## When you finish

Give me one table: task | done / skipped / needs me | notes. Then list: whether ygocompare.com shows Valid Configuration in Vercel (and if not, exactly what it says), the Vercel production URL, the Refresh prices run result (green or red, and the last 20 lines of its log if red), and every tab you left open with exactly what I need to do there.
