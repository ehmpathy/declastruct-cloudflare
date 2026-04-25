# transfer-in runbook

transfer domains into cloudflare from another registrar (e.g., squarespace, godaddy, route53).

## principle

**run apply, get guidance, repeat.**

declastruct detects what stage you're at and tells you exactly what to do next:

- zone absent → creates zone, guidance to update nameservers at source
- zone not active → guidance to update nameservers at source
- zone active, domain elsewhere → guidance to initiate transfer
- zone active, domain not registered → guidance to purchase
- zone active, domain in cloudflare → applies registration settings

you don't need to track where you are. just run apply — declastruct will guide you.

## flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         domain transfer flow                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. declastruct apply                                                   │
│     └─ creates zone if absent                                          │
│     └─ guidance: "update nameservers to cloudflare's at source"        │
│                                                                         │
│  2. update nameservers (manual)                                         │
│     └─ at source registrar dashboard or API                            │
│     └─ wait for propagation (up to 24-48h)                             │
│                                                                         │
│  3. declastruct apply                                                   │
│     └─ detects zone is now active                                      │
│     └─ guidance: "transfer domain from {registrar}"                    │
│        ├─ disable dnssec at source                                     │
│        ├─ disable whois privacy                                        │
│        ├─ unlock domain                                                │
│        ├─ get auth code                                                │
│        └─ enter auth code at cloudflare dashboard                      │
│                                                                         │
│  4. initiate transfer (manual)                                          │
│     └─ https://dash.cloudflare.com/{accountId}/domains/transfers       │
│     └─ approve FOA email                                               │
│     └─ wait up to 5 days (ICANN requirement)                           │
│                                                                         │
│  5. declastruct apply                                                   │
│     └─ domain now in cloudflare registrar                              │
│     └─ applies registration settings (autoRenew, locked, privacy)      │
│     └─ done                                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## prereqs

### 1. create cloudflare api token

see [howto.cloudflare.api-tokens-and-keys.md](../../.agent/repo=.this/role=any/briefs/howto.cloudflare.api-tokens-and-keys.md)

### 2. store credentials in keyrack

#### test (uses ehmpath owner)

```sh
rhx keyrack fill --owner ehmpath --env test
rhx keyrack unlock --owner ehmpath --env test
```

#### prod (requires OWNER env var)

```sh
rhx keyrack fill --owner $YOU --env prod
rhx keyrack unlock --owner $YOU --env prod
```

## usage

### 1. add domains to input file

```sh
# edit provision/transferin/inputs/env=test.json
{
  "domains": [
    "sunshineoceansurferturtles.com"
  ]
}
```

### 2. create zones first

create all zones before any guidance is emitted. zones propagate in parallel.

```sh
# plan zones only
ENV=prod OWNER=$YOU HALT_AFTER=zone npx declastruct plan \
  --wish provision/transferin/resources.ts \
  --into provision/transferin/plan.local.json

# apply zones
ENV=prod OWNER=$YOU HALT_AFTER=zone npx declastruct apply --plan provision/transferin/plan.local.json
```

### 3. proceed with registrations

after zones are created, remove `HALT_AFTER` to get transfer guidance:

```sh
# plan full (zones + registrations)
ENV=prod OWNER=$YOU npx declastruct plan \
  --wish provision/transferin/resources.ts \
  --into provision/transferin/plan.local.json

# apply and follow guidance
ENV=prod OWNER=$YOU npx declastruct apply --plan provision/transferin/plan.local.json
```

#### pre-filter 60-day locks (optional)

to pre-skip domains in 60-day lock (via WHOIS check):

```sh
EXCLUDE=ineligible.60day ENV=prod OWNER=$YOU npx declastruct plan \
  --wish provision/transferin/resources.ts \
  --into provision/transferin/plan.local.json
```

### 4. follow guidance

if you see guidance, follow the steps and re-run apply:

| guidance | what to do |
|----------|------------|
| "zone awaits nameserver delegation" | update NS at source registrar, wait for propagation, re-run apply |
| "60-day lock active" | wait N days (shown in guidance), re-run apply after lock expires |
| "transfer required" | follow the numbered steps in the guidance, re-run apply after transfer completes |
| "purchase required" | register domain via cloudflare dashboard, re-run apply |

repeat until apply completes without guidance.

## api limitations

| operation | API support | notes |
|-----------|-------------|-------|
| create zone | full | `setDomainZone` |
| update NS at source | none | use source registrar's API or dashboard |
| submit auth code | none | cloudflare dashboard only |
| update registration settings | full | `setDomainRegistration` (after domain is in cloudflare) |

## env vars

| var | default | description |
|-----|---------|-------------|
| ENV | (required) | test or prod |
| OWNER | ehmpath (test) / required (prod) | keyrack owner for credentials |
| HALT_AFTER | (none) | set to `zone` to skip registrations |
| EXCLUDE | (none) | set to `ineligible.60day` to pre-filter via WHOIS |

## troubleshoot

| issue | resolution |
|-------|------------|
| credentials not found (test) | `rhx keyrack fill --owner ehmpath --env test` |
| credentials not found (prod) | `rhx keyrack fill --owner $YOU --env prod` |
| OWNER env var required | set `OWNER=$YOU` for prod |
| zone already exists | idempotent — returns extant zone |
| zone stays not active | NS not updated or not propagated (wait 24-48h) |
| transfer fails | verify auth code, ensure domain unlocked at source |
| 60-day lock | domains cannot transfer within 60 days of registration or prior transfer |
