# rule.require.transfer-stage-guidance

## .motto

**guide the user at every step. zero drop offs.**

this is a fundamental principle of declastruct-cloudflare. users must never be left without clear next steps. every error, every incomplete state, every blocker must emit actionable guidance.

## .what

`setDomainRegistration` must emit stage-appropriate guidance for the entire domain transfer flow.

## .why

users should be able to run one command repeatedly and receive guidance for whatever stage they're at. they should never hit a dead end or wonder "what do i do now?"

## .stages

| stage | condition | guidance | owner |
|-------|-----------|----------|-------|
| 1 | zone doesn't exist | ref lookup fails | declastruct core (registration refs zone) |
| 2 | zone exists, status != active | "update nameservers at source" | setDomainRegistration |
| 3 | zone active, domain not in registrar (whois: elsewhere) | transfer guidance | setDomainRegistration |
| 3b | zone active, domain not in registrar (whois: unregistered) | purchase guidance | setDomainRegistration |
| 4 | domain in registrar | apply settings | setDomainRegistration |

## .current state

- stage 1: ✅ covered by domain object structure (registration refs zone)
- stage 2: ❌ not implemented
- stages 3, 3b, 4: ✅ implemented

## .implementation

`setDomainRegistration` should:

1. lookup zone via `getOneDomainZone` using the zone ref
2. if zone status !== 'active' → emit nameserver guidance
3. if zone active → proceed to current logic (whois check, transfer/purchase guidance)

## .example guidance

### stage 2: zone awaits nameserver update

```
domain "example.com" zone awaits nameserver delegation

⚠️ nameserver update required
   │
   ├─ at source registrar
   │  └─ update nameservers to:
   │     ├─ gannon.ns.cloudflare.com
   │     └─ tia.ns.cloudflare.com
   │
   └─ then wait for propagation (up to 24-48h)
      └─ re-run this command to check status
```

## .enforcement

- setDomainRegistration without zone status check = blocker
- zone not active without guidance = blocker
