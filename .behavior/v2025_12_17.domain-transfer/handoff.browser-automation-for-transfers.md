# handoff: browser automation for domain transfers

## the problem

cloudflare's registrar API does not support domain transfer initiation. the API only provides:
- `GET` — list/get domains
- `PUT` — update settings (auto_renew, locked, privacy)

there is no endpoint to submit an auth code or initiate a transfer programmatically. the `TransferIn` status fields are read-only indicators.

**transfers are dashboard-only.**

## the solution

port the browser automation pattern from `declastruct-squarespace`.

the pattern:
1. start a headful browser with persistent session (user data dir saves cookies)
2. human logs into cloudflare dashboard manually (handles Turnstile/2FA once)
3. session cookies persist across browser restarts
4. playbooks automate the repetitive dashboard clicks

this works because:
- cloudflare uses session cookies after login
- human handles authentication challenge once
- automation takes over for repetitive operations
- session persists in `.cache/browser.$session/profile/`

## what to port from declastruct-squarespace

### skills to copy

```
.agent/repo=.this/role=any/skills/
├── browser.lib.sh              # shared functions
├── browser.start.sh            # start persistent browser
├── browser.stop.sh             # stop browser
├── browser.describe.sh         # list tabs
├── browser.action.sh           # run playbooks
├── browser.snapshot.sh         # full snapshot
├── browser.snapshot.screen.sh  # screenshot
├── browser.snapshot.html.sh    # html dump
├── browser.snapshot.console.sh # console logs
├── browser.snapshot.network.sh # network activity
├── browser.snapshot.storage.sh # cookies/localStorage
└── browser.snapshot.meta.sh    # page metadata
```

### briefs to copy

```
.agent/repo=.this/role=any/briefs/
├── howto.browser-action-playbooks.md
├── howto.browser-byhand-work.md
├── howto.debug-via-browser.md
├── howto.test-via-browser.md
├── ref.antibot-escalation-best-practices.md
├── rule.require.action-verification.md
├── rule.require.bounded-timeouts-and-bisection.md
├── rule.require.grep-html-before-selector-guess.md
└── rule.forbid.unverified-actions.md
```

### directory structure to create

```
.play/
├── .gitignore           # ignores temporary/
├── permanent/           # committed playbooks
│   ├── goto-dashboard.play.ts
│   ├── goto-transfer-page.play.ts
│   └── initiate-transfer.play.ts
└── temporary/           # not committed (for ad-hoc exploration)
```

## playbooks to create

### goto-transfer-page.play.ts

```ts
import type { Page, Browser } from 'playwright';

/**
 * .what = navigate to cloudflare domain transfer page
 * .why = start point for transfer initiation
 */
export const action = async (input: {
  page: Page;
  browser: Browser;
  params: { accountId: string };
}) => {
  const { page } = input;
  const { accountId } = input.params;

  await page.goto(`https://dash.cloudflare.com/${accountId}/domains/transfer`, {
    waitUntil: 'load',
  });

  // wait for page to render
  await page.waitForTimeout(2000);

  return { url: page.url() };
};
```

### initiate-transfer.play.ts

```ts
import type { Page, Browser } from 'playwright';

/**
 * .what = initiate domain transfer with auth code
 * .why = automates the clicky-clicky after human auth
 *
 * .note
 *   - requires human to have logged in first
 *   - selectors need discovery via browser.snapshot html
 */
export const action = async (input: {
  page: Page;
  browser: Browser;
  params: { accountId: string; domain: string; authCode: string };
}) => {
  const { page } = input;
  const { accountId, domain, authCode } = input.params;

  // navigate to transfer page
  await page.goto(`https://dash.cloudflare.com/${accountId}/domains/transfer`, {
    waitUntil: 'load',
  });
  await page.waitForTimeout(2000);

  // TODO: discover actual selectors via browser.snapshot html
  // enter domain
  await page.fill('[data-testid="domain-input"]', domain);
  await page.waitForTimeout(500);

  // enter auth code
  await page.fill('[data-testid="auth-code-input"]', authCode);
  await page.waitForTimeout(500);

  // click confirm/submit
  await page.click('button:has-text("Confirm")');
  await page.waitForTimeout(2000);

  return {
    initiated: true,
    domain,
    url: page.url(),
  };
};
```

## workflow

### one-time setup

```sh
# 1. start headful browser
rhx browser.start --mode HEADFUL

# 2. human logs into cloudflare dashboard in the browser window
#    (handles Turnstile, 2FA, etc.)

# 3. verify session works
rhx browser.snapshot screen --tab 0 --url 'dash.cloudflare.com'
```

### transfer a domain

```sh
# 1. navigate to transfer page
rhx browser.action --play .play/permanent/goto-transfer-page.play.ts

# 2. snapshot to discover selectors (first time only)
rhx browser.snapshot html --tab 0 --url 'dash.cloudflare.com'

# 3. initiate transfer
rhx browser.action --play .play/permanent/initiate-transfer.play.ts \
  --params '{"accountId":"abc123","domain":"example.com","authCode":"XYZ789"}'
```

### batch transfers

```sh
# loop through domains
for domain in "${DOMAINS[@]}"; do
  rhx browser.action --play .play/permanent/initiate-transfer.play.ts \
    --params "{\"accountId\":\"$ACCOUNT_ID\",\"domain\":\"$domain\",\"authCode\":\"$AUTH_CODE\"}"
  sleep 2  # human-like timing
done
```

## integration with declastruct

the browser automation complements the extant declastruct pattern:

1. `setDomainRegistration` throws `BadRequestError` with transfer guidance
2. guidance now includes: "or use `rhx browser.action --play ...` to automate"
3. after transfer completes, re-run `declastruct apply` to set registration settings

## next steps

1. [ ] copy browser skills from declastruct-squarespace
2. [ ] copy relevant briefs
3. [ ] create `.play/` directory structure
4. [ ] start headful browser and login to cloudflare
5. [ ] use `browser.snapshot html` to discover actual selectors
6. [ ] create `goto-transfer-page.play.ts` with real selectors
7. [ ] create `initiate-transfer.play.ts` with real selectors
8. [ ] test with a real domain transfer
9. [ ] update `setDomainRegistration` guidance to mention browser automation option

## risks and war stories

**UPDATE 2026-04-07**: research reveals significant risks with this approach.

### cloudflare's official stance

from their Terms of Service:
> "You may not use automated bots to access, scan, scrape, data mine, copy, or use the materials or content on this website"

> "You may not exceed or circumvent, or try to exceed or circumvent, limitations on the Websites or Online Services, including on any API calls"

**the irony:** cloudflare's Registrar API is limited (transfers are dashboard-only), but they explicitly forbid automating their dashboard.

### detection mechanisms on dash.cloudflare.com

cloudflare uses their own protection stack on their dashboard:

| mechanism | description |
|-----------|-------------|
| TLS fingerprinting | checks TLS handshake characteristics |
| navigator.webdriver | detects automation flag |
| CDP detection | chrome devtools protocol signatures |
| browser fingerprinting | canvas, WebGL, audio context, fonts |
| Turnstile CAPTCHA | invisible challenges, proof-of-work |
| ML bot score | scores requests 1-99 on bot likelihood |
| behavioral analysis | navigation patterns, interaction timing |

**they eat their own dogfood** — automating dash.cloudflare.com is harder than automating sites that merely use cloudflare protection.

### rate limits

- global API rate limit: 1,200 requests per 5 minutes per user
- domain addition: max 25 domains per 10 minutes
- if you have >50 domains with more pending than active, blocked from adding more

### war stories from the community

| incident | source |
|----------|--------|
| users blocked from dash.cloudflare.com with unusual browser fingerprints | cloudflare community |
| 403 errors on registrar dashboard API endpoints | cloudflare community |
| challenge loops with Firefox Multi-Account Containers | github issue #2620 |
| account suspensions without warning | cloudflare community |
| non-mainstream browsers (Pale Moon) blocked entirely | hacker news |

### risk assessment for our use case

| risk | severity | impact |
|------|----------|--------|
| ToS violation | HIGH | explicit prohibition in terms |
| account suspension | HIGH | real war stories, no warning |
| detection likelihood | HIGH | cloudflare's own detection on their dashboard |
| unreliable operation | HIGH | stealth plugins vs constantly updating detection |
| no support | HIGH | cloudflare won't help debug automation |
| rate limits | MEDIUM | 25 domains per 10 min may be acceptable |

### recommendation

**browser automation of dash.cloudflare.com is NOT viable for production use.**

the risks outweigh the benefits:
- account suspension could affect all domains managed by that account
- ToS violation creates legal/contractual risk
- unreliable operation defeats the purpose of automation

### alternatives to consider

1. **manual dashboard with clear runbook** — current approach, safe
2. **request API access from cloudflare** — ask for registrar transfer endpoints
3. **enterprise plan** — may unlock additional API access
4. **accept the manual step** — transfers are infrequent, 5 clicks per domain is acceptable

### conclusion

the declastruct-squarespace pattern works because squarespace:
- has no API for domains (browser automation is the only option)
- uses cloudflare protection but is not cloudflare itself
- has no explicit ToS prohibition on automation

cloudflare is different:
- has an API (just incomplete for transfers)
- runs their own bot detection on their dashboard
- explicitly prohibits automation in ToS

**recommendation: do NOT proceed with browser automation. keep the manual dashboard approach with clear guidance in BadRequestError messages.**

---

## references

- declastruct-squarespace browser skills: `.agent/repo=.this/role=any/skills/browser.*.sh`
- declastruct-squarespace browser briefs: `.agent/repo=.this/role=any/briefs/howto.browser-*.md`
- cloudflare transfer page: `https://dash.cloudflare.com/{accountId}/domains/transfer`
- cloudflare ToS: https://www.cloudflare.com/website-terms/
- cloudflare API rate limits: https://developers.cloudflare.com/fundamentals/api/reference/limits/
- cloudflare bot detection: https://developers.cloudflare.com/bots/concepts/bot-detection-engines/
- cloudflare community war stories: https://community.cloudflare.com/
