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

1. fill keyrack credentials:

```sh
rhx keyrack fill --owner ehmpath --env test
```

2. unlock credentials for session:

```sh
rhx keyrack unlock --owner ehmpath --env test
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

### 2. plan changes

```sh
ENV=test npx declastruct plan \
  --wish provision/transferin/resources.ts \
  --into provision/transferin/plan.json
```

to pre-skip domains in 60-day lock (via WHOIS check):

```sh
EXCLUDE=ineligible.60day ENV=test npx declastruct plan \
  --wish provision/transferin/resources.ts \
  --into provision/transferin/plan.json
```

### 3. apply (and follow guidance)

```sh
ENV=test npx declastruct apply --plan provision/transferin/plan.json
```

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

## troubleshoot

| issue | resolution |
|-------|------------|
| credentials not found | `rhx keyrack fill --owner ehmpath --env test` |
| zone already exists | idempotent — returns extant zone |
| zone stays not active | NS not updated or not propagated (wait 24-48h) |
| transfer fails | verify auth code, ensure domain unlocked at source |
| 60-day lock | domains cannot transfer within 60 days of registration or prior transfer |
