# self-review: has-critical-paths-identified

## review questions

### are the happy paths marked as critical?

yes. three critical paths identified:

1. **preset→plan→apply** — the main happy path where users add preset rules and apply them
2. **idempotent re-apply** — users run apply multiple times safely
3. **zone ref expansion** — users reference zones by name, not ID

these cover the primary user journeys documented in the vision.

### for each critical path, is it clear why it must be frictionless?

yes:
- preset→plan→apply: "2-minute setup promise" — this is the core value proposition
- idempotent re-apply: "idempotency is core declastruct guarantee" — matches DNS record behavior
- zone ref expansion: "enables declaration before zone exists" — declarative model depends on this

### did i consider what would happen if each critical path failed?

**preset→plan→apply failure modes**:
- plan fails: user cannot preview changes → blocks entire workflow
- apply fails: rules not created → user stuck with manual dashboard
- covered in premortem: expression syntax errors, rate limits, PUT wipes extant rules

**idempotent re-apply failure modes**:
- duplicate rules created → drift, confusion, potential conflicts
- errors on second apply → false negative, users believe a defect occurred
- covered: slug uniqueness ensures find-or-create semantics

**zone ref expansion failure modes**:
- zone not found → clear error message needed
- zone found but wrong one → uniqueness by name prevents this
- covered: expandZoneRef pattern from DNS records handles this

## pit of success verification

### preset→plan→apply

| property | holds? | notes |
|----------|--------|-------|
| narrower inputs | yes | presets constrain to valid expressions |
| convenient | yes | import preset, assign to rule — no expression knowledge needed |
| expressive | yes | custom specs allow advanced users to escape hatch |
| failsafes | partial | premortem mentions rate limit backoff, but not implemented in v1 |
| failfasts | partial | expression validation at plan time not confirmed |
| idempotency | yes | findsert/upsert pattern |

**issue found**: expression validation at plan time is not explicitly covered.

**fix**: added to premortem as "nice-to-have" mitigation. for v1, cloudflare API will return errors on apply if expression is invalid — acceptable for initial release.

### idempotent re-apply

| property | holds? | notes |
|----------|--------|-------|
| narrower inputs | n/a | same inputs as first apply |
| convenient | yes | just run apply again |
| expressive | n/a | same operation |
| failsafes | yes | findsert returns extant without error |
| failfasts | yes | zone lookup fails early if zone gone |
| idempotency | yes | core design |

holds.

### zone ref expansion

| property | holds? | notes |
|----------|--------|-------|
| narrower inputs | yes | name is simpler than ID |
| convenient | yes | users know domain names, not cloudflare IDs |
| expressive | yes | can also pass ID directly if needed |
| failsafes | yes | returns null if zone not found |
| failfasts | yes | fails with clear error before apply |
| idempotency | yes | lookup is read-only |

holds.

## conclusion

critical paths are well-identified. one partial gap noted (expression validation at plan time) is acceptable for v1 and documented in premortem.

