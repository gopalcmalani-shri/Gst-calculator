# Solo-developer software businesses built with AI coding tools (games, apps, extensions, micro-SaaS), 2025–2026

Research date: 2026-11-18. Method note: WebFetch could not reach most primary sites in this session (revenuecat.com, 404media.co, extensionpay.com, playgama.com failed DNS under the session's network allowlist), so findings below rest on search-result excerpts. Many figures come from secondary or vendor blogs and are flagged as such. Treat every self-reported revenue number as unaudited and survivorship-biased.

## 1. Mobile games and apps on Google Play / App Store: revenue distribution, ads, IAP, UA cost, store rules and fees

### Takeaway
Revenue is extremely power-law: the median subscription app makes under ~$50/month a year after launch, while the top 5% make 400x the bottom quartile. For an India-based solo developer, ad income is especially thin because Indian ad eCPMs are a small fraction of US rates, and paid user acquisition for hybrid-casual games (~$1 CPI, 2024) is hard to recover without strong IAP. Google Play adds a mandatory ~2+ week closed-testing gate (12 testers x 14 days) for new personal accounts.

### Cited Findings
**Revenue distribution (subscription apps; RevenueCat State of Subscription Apps 2025, published ~March 2025)**
- The top 5% of newly launched apps make over 400x as much after their first year as the bottom 25%, who make no more than $19 in year one; the top-5% first-year figure is reported as ~$8,880 (official page) or $8,888 (secondary) — [RevenueCat SOSA 2025](https://revenuecat.com/state-of-subscription-apps-2025); [Mobile Marketing Reads](https://mobilemarketingreads.com/?p=47058)
- Median subscription app makes less than $50/month by its first anniversary (secondary report of the RevenueCat data) — [TechRepublic: "Most Apps Fail to Hit $1,000 Monthly Revenue Within Two Years"](https://www.techrepublic.com/es/article/news-apps-revenue-developers/)
- Median revenue per install after 60 days: $0.31 — [RevenueCat 2025 launch post](https://www.revenuecat.com/blog/company/the-state-of-subscription-apps-2025-launch)
- AI apps earn ~41% more per user but churn ~30% faster (RevenueCat finding, as headlined) — [PPC Land](https://ppc.land/ai-apps-earn-41-more-per-user-but-churn-30-faster-revenuecat-finds/)
- A 2026 edition exists (339 pages, 115,000+ apps, FY2025 data) — I did not obtain its medians — [Subscription Insider](https://subscriptioninsider.com/article-type/news/revenuecats-state-of-subscription-apps-2025-report-ais-dominance-retention-challenges-and-the-shift-away-from-pure-subscriptions)

**Game genre economics, ads and UA**
- CPI for hyper-casual games rose to ~$0.40; hybrid-casual almost doubled to ~$0.95 in 2024 (Adjust) — [Adjust Mobile Games Insights via GameDevReports](https://gamedevreports.substack.com/p/adjust-mobile-games-insights-report)
- D1 retention across all game genres averaged 27% in 2025 (Adjust 2026 report) — [Adjust Gaming App Insights 2026 via GameDevReports](https://gamedevreports.substack.com/p/adjust-gaming-app-insights-report)
- Hybrid-casual was the only segment with meaningful IAP growth in 2025 (+20% YoY); hybrid-casual blended monetization ~$0.15–$0.50 (metric unlabeled) with IAP at 40–60% of revenue — [Game Growth Advisor, 2026-03-17](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/)
- Median eCPM ~$5.00 for hyper-casual ad-based games (GameAnalytics benchmark, as summarized) — [GameAnalytics benchmarks 2025 via Game Industry Library](https://gameindustrylibrary.com/documents/gameanalytics-mobile-gaming-benchmarks-2025/read?page=12)
- Global eCPM ranges (citing Playwire 2025, unverified): rewarded $8–18, interstitial $2.5–5, banner $0.2–0.8 — [Playio blog](https://blog.playio.co/mobile-game-ad-revenue-calculator)
- Rewarded video eCPM in overseas casual games rebounded +18% YoY in 2025 H1 — [TopOn Global Mobile Games Monetization Report 2025 H1 (PDF)](https://mores.toponad.com/reports/TopOn%20Global%20Mobile%20Games%20Monetization%20Report%20_%202025%20H1.pdf)
- India vs US: US iOS rewarded $10–25 vs India Android rewarded $0.30–1.00 (vendor blog) — [Appalize](https://www.appalize.com/blog/monetization/admob-vs-alternatives-maximizing-your-ad-revenue); India AdMob rewarded ~$1.50 on Android (2022) and interstitial ~$1.10 Android (Q1 2023) — [Froggyads](https://froggyads.com/blog/google-admob-cpm). Vendor blogs conflict on ranges ($0.50–2.00 for India overall elsewhere).

**Google Play closed-testing rule and verification**
- Personal developer accounts created after Nov 13, 2023 must run a closed test with at least 12 testers opted in continuously for at least 14 days before applying for production access — [Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465)
- Requirement was originally 20 testers, later reduced to 12 — [Android Authority](https://www.androidauthority.com/google-play-app-testing-requirement-3510580)
- Developer reports: losing testers can reset the 14-day clock (anecdotal, not official); organization accounts avoid the rule but need a D-U-N-S number (up to ~30 days) — [Choicely](https://www.choicely.com/blog/google-play-12-tester-rule); critique as "12-tester tax" on solo devs — [Level Up Coding](https://levelup.gitconnected.com/the-12-tester-tax-google-plays-closed-testing-rule-is-quietly-killing-solo-devs-2cea83c2e338)
- Android developer verification rolled out to all developers in Play Console/new Android Developer Console from March 2026; enforcement for sideloaded apps starts Sept 30, 2026 in Brazil, Indonesia, Singapore, Thailand, global 2027+; Play developers already verified are registered automatically — [Android Developers Blog, Mar 2026](https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html?hl=be); [Android developer verification guide](https://developer.android.com/developer-verification/guides?hl=en)

**Store fees**
- Apple Small Business Program: 15% on first $1M annual proceeds (else 30%); subscriptions drop to 15% after a subscriber's first year regardless; Apple account $99/yr, Google $25 one-time — [Appbot](https://appbot.co/blog/app-developers-apple-google-small-business-programs/); [MacRumors, 2020](https://www.macrumors.com/2020/11/18/apple-drops-app-store-fees/)
- Google Play: 15% on first $1M/year (enrollment needed), 30% above; subscriptions 15% from day one (since Jan 2022) — [AppleInsider](https://appleinsider.com/articles/21/10/21/google-play-drops-all-subscription-commissions-to-15-from-day-one); [SplitMetrics, Aug 2025](https://splitmetrics.com/blog/google-play-apple-app-store-fees/)
- Reported mid-2026 restructuring of Google fees for UK/EEA/US (subscriptions 10% service + 5% billing); older structure persists in other markets (incl. presumably India) — secondary source only — [PricePush, 2026](https://pricepush.app/blog/app-store-fees-2026)

### Inferences
- A realistic solo outcome for a typical new app/game is $0–$50/month; reaching ~$1k/month puts a product roughly in the top decile.
- Hypercasual is a volume-and-UA business (publisher-driven); a solo dev without UA budget should favour puzzle/idle/hybrid-casual with IAP and organic/ASO, targeting Tier-1 users since India-heavy traffic yields ~$1 rewarded eCPM.
- The closed-testing rule adds ~2–3 weeks plus tester recruitment to the first launch; an organisation account (Indian proprietorship/LLP with D-U-N-S) is an alternative.

### Gaps
- No credible median-revenue figure for indie *games* specifically on Google Play/App Store (Sensor Tower/AppMagic distribution data not retrieved).
- No 2025 hybrid-casual CPI figure; no authoritative IAP payer-conversion benchmark (GameAnalytics typically cites ~1–3% but I did not retrieve a source).
- Could not confirm whether India is covered by Google's 2026 fee change.

## 2. Web game portals (CrazyGames, Poki, GameDistribution, itch.io)

### Takeaway
Web portals offer quick distribution with no store fee or testing gate, but revenue shares are non-public or negotiated, and reliable earnings data is scarce; typical portal games reportedly earn hundreds, not thousands, per month.

### Cited Findings
- CrazyGames: third-party guides cite ~55% ad revenue share (2025 blog) or 60% ads / 70% IAP under 2026 jam terms; payouts monthly via Tipalti above a €100 minimum — [Cinevva CrazyGames guide (2026)](https://app.cinevva.com/guides/publish-game-crazygames); [MultiGameDev, Nov 2025](https://multigamedev.blogspot.com/2025/11/html5-game-publishing-platforms-and-monetization.html)
- Poki: no published universal split; terms negotiated per title; guides describe 100% on developer-referred traffic and 50/50 on Poki-sourced traffic; also exclusive licensing deals — [Cinevva Poki guide (2026)](https://app.cinevva.com/guides/publish-game-poki); [Playgama comparison](https://playgama.com/blog/business-faqs/poki-vs-crazygames-vs-gamedistribution-revenue-share/)
- Poki announced a "625 million players" milestone (per headline/URL; exact metric and period not verified) achieved without external funding — [DigitalMediaNet](https://digitalmedianet.com/poki-announces-milestone-of-625-million-players-without-raising-external-funding/amp/); context on web gaming resurgence — [Naavik](https://naavik.co/digest/web-gaming-strikes-back/); [PocketGamer.biz](https://www.pocketgamer.biz/inside-pokis-vision-for-the-future-of-browser-gaming/)
- Aggregator claim (unverified): well-performing casual portal game $200–$2,000/month; top Poki titles up to ~€1M/year — [Cinevva web game monetization](https://app.cinevva.com/guides/web-game-monetization)
- itch.io: seller chooses itch's share 0–100%, default 10% — [itch.io forum](https://itch.io/post/1233634); a developer survey found 52% say itch.io generates <10% of their revenue — [PC Games Insider](https://www.pcgamesinsider.biz/news/68417/developers-dont-think-valves-30-per-cent-rev-share-is-justified-but-steam-is-still-the-most-popular-pc-storefront/); low-authority claim that most itch games earn under $100 lifetime — [GeneralistProgrammer](https://generalistprogrammer.com/tutorials/how-to-make-money-on-itchio-indie-game-guide)
- 2026 State of Web Gaming report exists (InvestGame, 2026-06-25) — not reviewed in detail — [InvestGame](https://investgame.net/news/pdf/2026-06-25-the_2026_state_of_web_gaming_report_4ee6fdc260_wp/)

### Inferences
- Portals suit fast AI-assisted HTML5 iteration (ship many small games, see which gets traction), but income is ad-driven and traffic is portal-controlled; treat as test bed and portfolio rather than primary income.
- Fly.pieter.com (Section 5) shows the alternative: own-domain web game monetised via sponsorships/ads, but driven by a large pre-existing audience.

### Gaps
- No official, current revenue-share percentages from CrazyGames/Poki/GameDistribution developer docs (fetch blocked); no audited developer earnings postmortems retrieved.

## 3. Utility apps and Chrome extensions

### Takeaway
Extensions can be built very quickly and freemium/subscription extensions occasionally reach 5 figures MRR, but published data is mostly self-reported success stories; the Chrome Web Store has no native payments, so developers use ExtensionPay/Stripe/MoR tools, and 2025 policy tightened affiliate-link monetization.

### Cited Findings
- Chrome Web Store affiliate policy update announced Mar 11, 2025, enforced from June 10, 2025: affiliate links/cookies only with disclosure (listing, UI, pre-install), user action, and real user benefit; violators can be removed — [Chrome for Developers blog](https://developer.chrome.com/blog/cws-policy-update-affiliate-ads-2025); [HelloPartner](https://hellopartner.com/2025/03/12/google-introduces-new-rules-for-affiliate-browser-extensions)
- ExtensionPay (Stripe-based payments for extensions) cumulative developer payouts: $9k (Oct 2021) to $25k later; a later Chromium-group post claims $500k+ (undated, unverified); fee reported as 5% + Stripe — [Indie Hackers ExtensionPay](https://www.indiehackers.com/product/extensionpay/25000-payments-in-browser-extensions--MvJwDXPIrwfoFTC2Az4); [Chromium extensions group](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/ctDt86Z9B8I)
- Developer report: ExtensionPay is "the only practical solution" for extension payments but unfamiliar extensionpay.com checkout can depress conversion — [DEV: freemium Chrome extension real numbers](https://dev.to/_350df62777eb55e1/real-numbers-freemium-chrome-extension-monetization-after-6-months-5hga); also [DEV: 7 paid extensions](https://dev.to/ktg0215/monetizing-chrome-extensions-with-freemium-real-numbers-from-7-paid-extensions-5cj)
- Superpower ChatGPT (solo, Saeed Ezzati): ~$20–30k MRR, freemium, ~270k downloads (Starter Story episode Feb 2026; Indie Hackers lists "5-figure MRR") — [Indie Hackers](https://www.indiehackers.com/post/building-a-free-chrome-extension-in-3-days-and-turning-it-into-a-5-figure-mrr-ecosystem-3rIbjigZxiFsrgqJjJYp); [Starter Story $20k/month extension](https://www.starterstory.com/stories/how-i-built-it-20k-month-chrome-extension)
- SuperX (solo, started Jan 2025): $1k MRR by May 2025, $14k MRR later, 5,000+ creators, bootstrapped — [Superframeworks case study](https://superframeworks.com/case-study/superx)
- Smaller anecdotes: LinkedIn-rewriting extension at $1,200 MRR; NoTab got a paying user one day after listing — [Indie Hackers](https://www.indiehackers.com/post/i-finally-hit-1-200-mrr-and-it-wasnt-from-the-ai-thing-everyone-said-to-build-f21988c37a); [DEV](https://dev.to/_af1eb8cb8faab148e10b3c/how-i-built-a-chrome-extension-in-3-days-and-got-paying-users-the-day-after-launch-47o0)
- Developer built 20 extensions, sold four in a month (extension flipping as exit) — [IndieNiche](https://indieniche.substack.com/p/he-built-20-chrome-extensions-sold)

### Inferences
- Extensions piggybacking on large platforms (ChatGPT, X, LinkedIn, Pinterest) are the most common pattern among winners; they carry platform risk (DOM changes, ToS).
- Portfolio approach (many small extensions, sell or kill) matches AI-accelerated build speed.

### Gaps
- No distributional data (median extension revenue); no 2025–2026 Chrome Web Store fee/registration change found (historically a one-time $5 fee, not re-verified).

## 4. Micro-SaaS / AI tools by solo founders: revenue, churn, support, payments from India

### Takeaway
Roughly half to 70% of indie/micro-SaaS products with revenue sit under $1k MRR (directional data only). For an Indian founder, payment rails are a real constraint: Stripe India is invite-only, Lemon Squeezy (Stripe-owned) onboarding for Indians is reportedly difficult, so Paddle, Dodo Payments, Razorpay International or similar are the practical routes.

### Cited Findings
- Directional distribution: ~half of active indie hackers at $0–1k MRR, <5% ever cross $100k MRR (BetterLaunch community data, "approximate"); a tracker of 8,699 startups shows median ~$145 MRR, ~70% under $1k, 6.1% over $10k (methodology unclear); median among *profitable* products ~$4.2k MRR (Freemius 2025, as cited) — [Mean CEO micro-SaaS stats](https://blog.mean.ceo/?p=11213); [micro-SaaS statistics 2026](https://content-site-lovat.vercel.app/articles/micro-saas-statistics-2026.html)
- Solo case: $125k MRR solo founder by focusing on one segment — [Indie Hackers](https://www.indiehackers.com/post/hitting-125k-mrr-as-a-solo-founder-by-doubling-down-on-the-right-segment-c4o2Tfs6mjdpip5yZhaO)
- Stripe in India is invite-only (from ~May 2024); Indian businesses must request an invite for international payments — [Stripe Docs: India exports](https://docs.stripe.com/india-exports); [Stripe Support](https://support.stripe.com/questions/accepting-international-payments-from-stripe-accounts-in-india); [The Paypers](https://thepaypers.com/payments/news/stripe-moves-to-invite-only-in-india)
- Stripe acquired Lemon Squeezy (July 2024); Indian founders report rejections/delays from Lemon Squeezy and Paddle (anecdotal Reddit) — [StartupTalky](https://startuptalky.com/lemonsqueezy-alternative-for-indian-saas-accepting-global-payments/); [r/SaaS thread](https://redlib.belloworld.it/r/SaaS/comments/1gfjoo8/got_rejected_by_lemonsqueezy_and_paddle/luk4eof)
- Alternatives cited for Indian SaaS: Paddle and Dodo Payments (merchant of record, handle global tax), Razorpay International, Skydo/Payoneer for B2B — vendor-authored sources — [Dodo Payments](https://dodopayments.com/blogs/stripe-alternatives-india); [Skydo](https://www.skydo.com/compare/stripe-alternatives.md)
- Churn: AI apps churn ~30% faster than non-AI (RevenueCat, mobile subs) — [PPC Land](https://ppc.land/ai-apps-earn-41-more-per-user-but-churn-30-faster-revenuecat-finds/)

### Inferences
- An India-based founder should plan for a merchant-of-record (MoR) from day one (handles VAT/sales tax; payouts arrive as export receipts, relevant for GST export-of-services/LUT and FIRA documentation).
- AI-wrapper tools face high churn and inference-cost exposure; usage-priced or credit-based plans reduce the risk of API-cost blowouts.

### Gaps
- No quantitative support-burden data (tickets per 100 customers, hours/week) found for solo SaaS; no rigorous micro-SaaS churn benchmark (B2C vs B2B) retrieved.
- No named, rigorous 2025 survey of micro-SaaS revenue distribution; figures above are aggregator-level.

## 5. "Vibe-coded" success and failure stories, 2025–2026

### Takeaway
Headline wins exist (fly.pieter.com; several Claude Code/Cursor-built SaaS at $20k–60k MRR), but they are dominated by founders with existing audiences and are self-reported; systematic data shows apps still on vibe-coding platform subdomains rarely earn anything, and security failures have killed some vibe-coded products within days.

### Cited Findings
- fly.pieter.com (Pieter Levels): built with Cursor starting Feb 22, 2025 (~3 hours to first version); Levels reported $0 to $1M ARR in 17 days, $87k MRR (early March 2025); revenue from in-game ads/sponsor billboards and paid planes (e.g., $29.99 F-16) — [levels.io write-up](https://levels.io/full-multiplayer-python-websockets-game-ai); [VGTimes](https://vgtimes.com/tech-and-hardware/122582-dutch-startup-founder-creates-game-using-ai-in-180-minutes-and-earns-87000-in-one-month.html)
- Later figures conflict: one roundup claims ~$138k/month; 404 Media reported ~$50k/month and argued most copycats won't replicate it; a June 2025 blog estimated ~$5k/month; a DEV article titles it "hit $1M a year in 17 days, then it went to zero" — [404 Media](https://www.404media.co/this-game-created-by-ai-vibe-coding-makes-50-000-a-month-yours-probably-wont/); [JK Xu blog, 2025-06-18](https://jkevinxu.github.io/github-blog/entrepreneurship/development/2025/06/18/pieter-levels-lessons-for-individual-developers.html); [DEV](https://dev.to/promptway/he-built-a-flight-simulator-in-three-hours-and-hit-1m-a-year-in-17-days-then-it-went-to-zero-1b1l)
- Claude Code/AI-editor cases (self-reported, secondary): Mac app $20k MRR in 83 days with Claude Code; Trew $62k MRR in 90 days; Modest Mitkus (non-coder) +$23k MRR Oct 2025 — [Pulse.bot](https://www.pulse.bot/entrepreneurship/blogs/he-built-a-20k-mrr-mac-app-with-claude-code-663604dd-fccf-4295-9122-d4d814d6b9ba/); [AIProductivity](https://aiproductivity.ai/news/solo-founder-62k-mrr-ai-code-editors/); [John Ellison Substack](https://iamjohnellison.substack.com/p/the-vibe-coding-wave-is-here-5-builders)
- Systematic counterpoint (BigIdeasDB analysis of TrustMRR, verified Sept 25, 2026): apps on vibe-coding subdomains — 7.6% report MRR vs 43.5% across the index; highest-earning such app makes $155/month; selling tools to other vibe coders more reliable than consumer apps — [BigIdeasDB](https://bigideasdb.com/how-to-make-money-vibe-coding)
- Enrichlead (Leo Acevedo, built with Cursor, "zero hand-written code"): shut down ~March 2025 within days after exposed API keys / client-side paywall bypass (accounts differ on details) — [Vibe Graveyard](https://vibegraveyard.ai/story/enrichlead-vibe-coded-saas-shutdown/); [Kodu blog](https://blog.kodu.cloud/vibe-coded-apps-leaked-api-keys)
- Scan of ~130,000 vibe-coded sites found ~26,000 (1 in 5) with at least one leaked secret — [RedHunt Labs](https://redhuntlabs.com/blog/echoes-of-ai-exposure-thousands-of-secrets-leaking-through-vibe-coded-sites-wave-15-project-resonance/?amp=1); Moltbook leak exposed auth tokens/private messages — [CPO Magazine](https://www.cpomagazine.com/cyber-security/data-leak-at-moltbook-exposes-millions-of-authentication-tokens-and-private-messages/)

### Inferences
- Distribution, not build speed, is the binding constraint: Levels already had a very large X audience (follower count not sourced here); most winners had an audience or a niche channel. Building cheaply makes many small bets viable, but expect most to earn ~$0.
- Security basics (server-side paywall checks, no secrets in frontend, rate limits, API spend caps) are non-optional; a single leak can turn a launch into an API bill.

### Gaps
- Could not verify fly.pieter.com's current (late 2026) revenue; no primary verification of Trew/$20k Mac app claims.
